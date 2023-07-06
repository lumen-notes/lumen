import { useAtomValue } from "jotai"
import React from "react"
import { LoadingIcon16 } from "../components/icons"
import { githubRepoAtom, githubTokenAtom } from "../global-atoms"
import { readRawFile } from "../utils/github-fs"

export const fileCache = new Map<string, { file: File; url: string }>()

type FilePreviewProps = {
  path: string
  alt?: string
}

export function FilePreview({ path, alt = "" }: FilePreviewProps) {
  const githubToken = useAtomValue(githubTokenAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const cachedFile = fileCache.get(path)
  const [file, setFile] = React.useState<File | null>(cachedFile?.file ?? null)
  const [url, setUrl] = React.useState(cachedFile?.url ?? "")
  const [isLoading, setIsLoading] = React.useState(!cachedFile)

  React.useEffect(() => {
    if (!file) {
      loadFile()
    }

    async function loadFile() {
      if (!githubRepo) return
      try {
        setIsLoading(true)

        const file = await readRawFile({ githubToken, githubRepo, path })
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
  }, [file, githubToken, githubRepo, path])

  if (!file) {
    return isLoading ? (
      <div className="flex items-center gap-2 leading-4 text-text-secondary">
        <LoadingIcon16 />
        Loading…
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

  // PDF (< 3 MB)
  if (file.type === "application/pdf" && file.size < 3_000_000) {
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
