import { useAtomValue } from "jotai"
import React from "react"
import { useNetworkState } from "react-use"
import { ErrorIcon16, LoadingIcon16, OfflineIcon16 } from "../components/icons"
import { REPO_DIR, githubRepoAtom, githubUserAtom } from "../global-state"
import { getFileUrl, readFile } from "../utils/fs"

export const fileCache = new Map<string, { file: File; url: string }>()

type FilePreviewProps = {
  path: string
  alt?: string
}

export function FilePreview({ path, alt = "" }: FilePreviewProps) {
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const cachedFile = fileCache.get(path)
  const [file, setFile] = React.useState<File | null>(cachedFile?.file ?? null)
  const [url, setUrl] = React.useState(cachedFile?.url ?? "")
  const [isLoading, setIsLoading] = React.useState(!cachedFile)
  const { online } = useNetworkState()

  React.useEffect(() => {
    // If file is already cached, don't fetch it again
    if (file) return

    async function loadFile() {
      if (!githubUser || !githubRepo) return

      try {
        setIsLoading(true)

        const file = await readFile(`${REPO_DIR}${path}`)
        const url = await getFileUrl({ file, path, githubUser, githubRepo })

        setFile(file)
        setUrl(url)

        // Cache the file and its URL
        fileCache.set(path, { file, url })
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFile()
  }, [file, githubUser, githubRepo, path])

  if (!file) {
    return isLoading ? (
      <div className="flex items-center gap-2 leading-4 text-text-secondary">
        <LoadingIcon16 />
        Loading…
      </div>
    ) : !online ? (
      <div className="flex items-center gap-2 leading-4 text-text-secondary">
        <OfflineIcon16 />
        File not available
      </div>
    ) : (
      <div className="flex items-center gap-2 leading-4 text-text-danger">
        <ErrorIcon16 />
        File not found
      </div>
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
