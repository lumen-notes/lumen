import { useActor } from "@xstate/react"
import mime from "mime"
import React from "react"
import { LoadingIcon16 } from "../components/icons"
import { Context, GlobalStateContext } from "../global-state"

export const fileCache = new Map<string, { file: File; url: string }>()

type FilePreviewProps = {
  path: string
  alt?: string
}

export function FilePreview({ path, alt = "" }: FilePreviewProps) {
  const cachedFile = fileCache.get(path)
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const [file, setFile] = React.useState<File | null>(cachedFile?.file || null)
  const [url, setUrl] = React.useState(cachedFile?.url || "")
  const [isLoading, setIsLoading] = React.useState(!cachedFile)

  React.useEffect(() => {
    if (!file && state.matches("connected")) {
      loadFile()
    }

    async function loadFile() {
      try {
        setIsLoading(true)

        const file = await readFile(state.context, path)
        const url = URL.createObjectURL(file)

        setFile(file)
        setUrl(url)

        // Cache the file and base64 data
        fileCache.set(path, { file, url })
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [file, state, path])

  if (!file) {
    return isLoading || !state.matches("connected") ? (
      <div className="flex items-center gap-2 leading-4 text-text-secondary">
        <LoadingIcon16 />
        Loading...
      </div>
    ) : (
      <div>File not found</div>
    )
  }

  // Image
  if (file.type.startsWith("image/")) {
    return <img src={url} alt={alt} />
  }

  // Video
  if (file.type.startsWith("video/")) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video controls>
        <source src={url} type={file.type} />
      </video>
    )
  }

  // Audio
  if (file.type.startsWith("audio/")) {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <audio controls src={url} className="w-full max-w-lg" />
  }

  // PDF (< 1 MB)
  if (file.type === "application/pdf" && file.size < 1_000_000) {
    return <iframe title={file.name} src={url} className="h-full w-full" />
  }

  return (
    <div>
      <a download={file.name} href={url} className="link">
        Download {file.name} ({(file.size / 1_000_000).toFixed(1)} MB)
      </a>
    </div>
  )
}

async function readFile(context: Context, path: string) {
  const response = await fetch(
    `https://api.github.com/repos/${context.repoOwner}/${context.repoName}/contents/${
      // Remove leading slash if present
      path.replace(/^\//, "")
    }`,
    {
      headers: {
        Authorization: `Bearer ${context.authToken}`,
        Accept: "application/vnd.github.raw",
      },
    },
  )

  if (!response.ok || !response.body) {
    throw new Error(response.statusText)
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
