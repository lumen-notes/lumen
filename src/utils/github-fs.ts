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
}

export async function writeFile({ githubToken, githubRepo, path, content }: WriteFileOptions) {
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
      message: `${fileExists ? "Update" : "Create"} ${path}`,
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
