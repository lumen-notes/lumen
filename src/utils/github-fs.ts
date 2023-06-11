import { Buffer } from "buffer"
import mime from "mime"
import { GitHubRepository } from "../types"

function getFileEndpoint(githubRepo: GitHubRepository, path: string) {
  return `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.name}/contents/${
    // Remove leading slash if present
    path.replace(/^\//, "")
  }`
}

type GetFileShaOptions = {
  githubToken: string
  githubRepo: GitHubRepository
  path: string
}

export async function getFileSha({
  githubToken,
  githubRepo,
  path,
}: GetFileShaOptions): Promise<string | null> {
  // Get the SHA of the file
  const response = await fetch(getFileEndpoint(githubRepo, path), {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${githubToken}`,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })

  if (!response.ok) {
    // Failing to get the SHA is sometimes expected, so we don't throw an error
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sha } = (await response.json()) as any

  return sha ?? null
}

type ReadFileOptions = {
  githubToken: string
  githubRepo: GitHubRepository
  path: string
}

export async function readFile({ githubToken, githubRepo, path }: ReadFileOptions) {
  const response = await fetch(getFileEndpoint(githubRepo, path), {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${githubToken}`,
    },
  })

  if (!response.ok) {
    console.error(response)

    switch (response.status) {
      // Unauthorized
      case 401:
        throw new Error(`Invalid GitHub token`)

      // Not found
      case 404:
        throw new Error(`File not found: ${path} in ${githubRepo.owner}/${githubRepo.name}`)

      // Other error
      default:
        throw new Error(
          `Failed to fetch file: ${path} in ${githubRepo.owner}/${githubRepo.name} (${response.status})`,
        )
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { content } = (await response.json()) as any

  return Buffer.from(content, "base64").toString("utf8")
}

// Used to read large files like images or PDFs
export async function readRawFile({ githubToken, githubRepo, path }: ReadFileOptions) {
  const response = await fetch(getFileEndpoint(githubRepo, path), {
    headers: {
      Accept: "application/vnd.github.raw",
      Authorization: `Bearer ${githubToken}`,
    },
  })

  if (!response.ok || !response.body) {
    console.error(response)

    switch (response.status) {
      // Unauthorized
      case 401:
        throw new Error(`Invalid GitHub token`)

      // Not found
      case 404:
        throw new Error(`File not found: ${path} in ${githubRepo.owner}/${githubRepo.name}`)

      // Other error
      default:
        throw new Error(
          `Failed to fetch file: ${path} in ${githubRepo.owner}/${githubRepo.name} (${response.status})`,
        )
    }
  }

  // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams#reading_the_stream
  const reader = response.body.getReader()

  const stream = new ReadableStream({
    start(controller) {
      // @ts-ignore
      function push() {
        return reader.read().then(({ done, value }) => {
          // When no more data needs to be consumed, close the stream
          if (done) {
            controller.close()
            return
          }

          // Enqueue the next data chunk into our target stream
          controller.enqueue(value)
          return push()
        })
      }

      return push()
    },
  })

  const blob = await new Response(stream).blob()
  const mimeType = mime.getType(path) ?? ""
  const filename = path.split("/").pop() ?? ""
  return new File([blob], filename, { type: mimeType })
}

type WriteFileOptions = {
  githubToken: string
  githubRepo: GitHubRepository
  path: string
  content: string | ArrayBuffer
  commitMessage?: string
}

export async function writeFile({
  githubToken,
  githubRepo,
  path,
  content,
  commitMessage,
}: WriteFileOptions) {
  // Get the SHA of the file
  const sha = await getFileSha({ githubToken, githubRepo, path })

  // If the file doesn't exist, `sha` will be null
  const fileExists = Boolean(sha)

  // Create or update the file
  const response = await fetch(getFileEndpoint(githubRepo, path), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${githubToken}`,
    },
    body: JSON.stringify({
      message: commitMessage ?? `${fileExists ? "Update" : "Create"} ${path}`,
      // @ts-ignore Despite the type definition, Buffer.from() does accept `string | ArrayBuffer`
      content: Buffer.from(content).toString("base64"),
      sha,
    }),
  })

  if (!response.ok) {
    console.error(response)

    throw new Error(
      `Failed to ${fileExists ? "update" : "create"} file: ${path} ${response.status}}`,
    )
  }
}

type WriteFilesOptions = {
  githubToken: string
  githubRepo: GitHubRepository
  // Map of file paths to file contents
  files: Record<string, string>
  commitMessage?: string
}

// TODO: Handle errors
export async function writeFiles({
  githubToken,
  githubRepo,
  files,
  commitMessage,
}: WriteFilesOptions) {
  const latestCommitSha = await getLatestCommitSha()
  const newTreeSha = await createNewTree(latestCommitSha)
  const newCommitSha = await createNewCommit(latestCommitSha, newTreeSha)
  await updateBranch(newCommitSha)

  // Get the SHA of the latest commit on the branch
  async function getLatestCommitSha() {
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.name}/git/ref/heads/main`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      },
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await response.json()) as any
    return data.object.sha
  }

  // Create a new tree object with the updated files
  async function createNewTree(latestCommitSha: string) {
    const fileTree = Object.entries(files).map(([path, content]) => ({
      path,
      mode: "100644",
      type: "blob",
      content,
    }))
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.name}/git/trees`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          base_tree: latestCommitSha,
          tree: fileTree,
        }),
      },
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await response.json()) as any
    return data.sha
  }

  // Create a new commit with the updated tree
  async function createNewCommit(latestCommitSha: string, newTreeSha: string) {
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.name}/git/commits`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          message: commitMessage ?? `Update ${Object.keys(files).join(", ")}`,
          parents: [latestCommitSha],
          tree: newTreeSha,
        }),
      },
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await response.json()) as any
    return data.sha
  }

  // Update the branch to point to the new commit
  async function updateBranch(newCommitSha: string) {
    await fetch(
      `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.name}/git/refs/heads/main`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          sha: newCommitSha,
        }),
      },
    )
  }
}

type DeleteFileOptions = {
  githubToken: string
  githubRepo: GitHubRepository
  path: string
}

export async function deleteFile({ githubToken, githubRepo, path }: DeleteFileOptions) {
  // Get the SHA of the file
  const sha = await getFileSha({ githubToken, githubRepo, path })

  if (!sha) {
    // File doesn't exist, so we don't need to delete it
    return
  }

  // Delete the file
  const response = await fetch(getFileEndpoint(githubRepo, path), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${githubToken}`,
    },
    body: JSON.stringify({
      message: `Delete ${path}`,
      sha,
    }),
  })

  if (!response.ok) {
    console.error(response)

    throw new Error(`Failed to delete file: ${path} (${response.status})`)
  }
}
