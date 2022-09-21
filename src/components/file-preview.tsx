import { useActor } from "@xstate/react"
import { encode } from "base64-arraybuffer"
import React from "react"
import { LoadingIcon16 } from "../components/icons"
import { GlobalStateContext } from "../global-state"

export function FilePreview({ path }: { path: string }) {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const [file, setFile] = React.useState<File | null>(null)
  const [base64, setBase64] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!file && state.matches("connected")) {
      loadFile()
    }

    async function loadFile() {
      if (!state.context.directoryHandle) return

      try {
        setIsLoading(true)

        const file = await readFile(state.context.directoryHandle, path)
        const arrayBuffer = await file.arrayBuffer()
        const base64 = encode(arrayBuffer)

        setFile(file)
        setBase64(base64)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [file, state, path])

  if (!file) {
    return isLoading || !state.matches("connected") ? (
      <div className="flex items-center gap-2 text-text-muted">
        <LoadingIcon16 /> Loading...
      </div>
    ) : (
      <div>File not found</div>
    )
  }

  const src = `data:${file.type};base64,${base64}`

  // Image
  if (file.type.startsWith("image/")) {
    return <img src={src} alt="" />
  }

  // Video
  if (file.type.startsWith("video/")) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video controls>
        <source src={src} type={file.type} />
      </video>
    )
  }

  // Audio
  if (file.type.startsWith("audio/")) {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <audio controls src={src} />
  }

  // PDF (< 1 MB)
  if (file.type === "application/pdf" && file.size < 1000000) {
    return <iframe title={path} src={src} className="h-screen w-screen" />
  }

  return (
    <div>
      <a download={file.name} href={src} className="rounded underline underline-offset-2">
        Download {file.name} ({(file.size / 1000000).toFixed(1)} MB)
      </a>
    </div>
  )
}

async function readFile(rootHandle: FileSystemDirectoryHandle, path: string) {
  // '/uploads/123.jpg' -> ['uploads', '123.jpg']
  const pathArray = path.split("/").filter(Boolean)
  const fileHandle = await getFileHandle(rootHandle, pathArray)
  return await fileHandle.getFile()
}

async function getFileHandle(
  rootHandle: FileSystemDirectoryHandle,
  path: string[],
): Promise<FileSystemFileHandle> {
  if (path.length === 1) {
    return await rootHandle.getFileHandle(path[0])
  }

  const directoryHandle = await rootHandle.getDirectoryHandle(path[0])
  return await getFileHandle(directoryHandle, path.slice(1))
}
