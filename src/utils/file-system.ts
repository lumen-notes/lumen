import mime from "mime"
import { Context } from "../global-state"
import { Buffer } from "buffer"

const GITHUB_ENDPOINT = "https://api.github.com"

type ReadFileOptions = {
  context: Context
  path: string
}

export async function readFile({ context, path }: ReadFileOptions) {
  const response = await fetch(
    `https://api.github.com/repos/${context.repoOwner}/${context.repoName}/contents/${
      // Remove leading slash if present
      path.replace(/^\//, "")
    }`,
    {
      headers: {
        Accept: "application/vnd.github.raw",
        Authorization: `Bearer ${context.authToken}`,
      },
    },
  )

  if (!response.ok || !response.body) {
    switch (response.status) {
      // Unauthorized
      case 401:
        throw new Error(`Invalid GitHub token`)

      // Not found
      case 404:
        throw new Error(`File not found: ${path}`)

      // Other error
      default:
        throw new Error(`Failed to fetch file: ${path} (${response.status})`)
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
  const mimeType = mime.getType(path) || ""
  const filename = path.split("/").pop() || ""
  return new File([blob], filename, { type: mimeType })
}

type WriteFileOptions = {
  context: Context
  path: string
  content: string | ArrayBuffer
}

export async function writeFile({ context, path, content }: WriteFileOptions) {
  const endpoint = `${GITHUB_ENDPOINT}/repos/${context.repoOwner}/${context.repoName}/contents/${
    // Remove leading slash if present
    path.replace(/^\//, "")
  }`

  // Get the SHA of the file
  const { sha } = await fetch(endpoint, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${context.authToken}`,
    },
  }).then((response) => response.json())

  const fileExists = Boolean(sha)

  // Create or update the file
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${context.authToken}`,
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
  context: Context
  path: string
}

export async function deleteFile({ context, path }: DeleteFileOptions) {
  const endpoint = `${GITHUB_ENDPOINT}/repos/${context.repoOwner}/${context.repoName}/contents/${
    // Remove leading slash if present
    path.replace(/^\//, "")
  }`

  // Get the SHA of the file
  const { sha } = await fetch(endpoint, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${context.authToken}`,
    },
  }).then((response) => response.json())

  // Delete the file
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${context.authToken}`,
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
