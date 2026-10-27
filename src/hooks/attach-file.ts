import { EditorView } from "@codemirror/view"
import { useAtomCallback } from "jotai/utils"
import React from "react"
import { fileCache } from "../components/file-preview"
import { githubRepoAtom, githubUserAtom } from "../global-state"
import { GitHubRepository, GitHubUser } from "../schema"
import { fs, writeFile } from "../utils/fs"
import { REPO_DIR, gitAdd, gitCommit } from "../utils/git"

export const UPLOADS_DIR = "/uploads"

const offlineMessage = "Couldn't attach the file because you're offline."
const missingRepoMessage = "Couldn't attach the file because no repository is connected."

export async function attachDroppedFile({
  file,
  view,
  githubUser,
  githubRepo,
  coords,
}: {
  file: File
  view: EditorView
  githubUser: GitHubUser | null
  githubRepo: GitHubRepository | null
  coords?: { x: number; y: number }
}): Promise<string | null> {
  if (!navigator.onLine) return offlineMessage
  if (!githubUser || !githubRepo) return missingRepoMessage

  try {
    const id = Date.now().toString()
    const extension = file.name.split(".").pop()
    const name = file.name.replace(`.${extension}`, "")
    const path = `${UPLOADS_DIR}/${id}.${extension}`
    const arrayBuffer = await file.arrayBuffer()

    try {
      await fs.promises.mkdir(`${REPO_DIR}${UPLOADS_DIR}`)
    } catch {
      // The uploads directory already exists.
    }

    await writeFile({
      path: `${REPO_DIR}${path}`,
      content: arrayBuffer,
      githubUser,
      githubRepo,
    })

    let gitError: string | null = null
    try {
      const relativePath = path.replace(/^\//, "")
      await gitAdd([relativePath])
      await gitCommit(`Update ${relativePath}`)
    } catch (error) {
      gitError = attachError(error)
    }

    fileCache.set(path, { file, url: URL.createObjectURL(file) })

    const { from, to } = insertRange(view, coords)
    const selectedText = from === to ? "" : view.state.doc.sliceString(from, to)
    let markdown = `[${selectedText || name}](${path})`
    if (
      file.type.startsWith("image/") ||
      file.type.startsWith("video/") ||
      file.type.startsWith("audio/")
    ) {
      markdown = `!${markdown}`
    }

    let anchor: number | undefined
    let head: number | undefined
    if (selectedText) {
      anchor = from + markdown.length
    } else {
      anchor = from + markdown.indexOf("]")
      head = from + markdown.indexOf("[") + 1
    }

    view.dispatch({
      changes: [{ from, to, insert: markdown }],
      selection: { anchor, head },
    })
    view.focus()
    return gitError
  } catch (error) {
    return attachError(error)
  }
}

function insertRange(view: EditorView, coords?: { x: number; y: number }) {
  if (coords) {
    const pos = view.posAtCoords(coords)
    if (pos != null) return { from: pos, to: pos }
  }
  const range = view.state.selection.ranges[view.state.selection.mainIndex]
  return { from: range?.from ?? 0, to: range?.to ?? 0 }
}

function attachError(error: unknown) {
  if (error instanceof Error && error.message) {
    return `Couldn't attach the file. ${error.message}`
  }
  return "Couldn't attach the file."
}

export function useAttachFile(onError?: (message: string | null) => void) {
  const getGitHubUser = useAtomCallback(React.useCallback((get) => get(githubUserAtom), []))
  const getGitHubRepo = useAtomCallback(React.useCallback((get) => get(githubRepoAtom), []))

  const attachFile = React.useCallback(
    async (file: File, view?: EditorView, coords?: { x: number; y: number }) => {
      if (!view) {
        onError?.("Couldn't attach the file.")
        return
      }
      const message = await attachDroppedFile({
        file,
        view,
        githubUser: getGitHubUser(),
        githubRepo: getGitHubRepo(),
        coords,
      })
      onError?.(message)
    },
    [getGitHubRepo, getGitHubUser, onError],
  )

  return attachFile
}
