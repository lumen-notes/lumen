import { EditorView } from "@codemirror/view"
import { useAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import React from "react"
import { fileCache } from "../components/file-preview"
import { githubRepoAtom, githubTokenAtom } from "../global-atoms"
import { writeFile } from "../utils/github-fs"

export const UPLOADS_DIRECTORY = "uploads"

export function useAttachFile() {
  // HACK: getGitHubToken() returns an empty string if the atom is not initialized
  useAtom(githubTokenAtom)
  const getGitHubToken = useAtomCallback(React.useCallback((get) => get(githubTokenAtom), []))
  const getGitHubRepo = useAtomCallback(React.useCallback((get) => get(githubRepoAtom), []))

  const attachFile = React.useCallback(
    async (file: File, view?: EditorView) => {
      const githubToken = getGitHubToken()
      const githubRepo = getGitHubRepo()

      // We can't upload a file if we don't know where to upload it to
      // or if we don't have a reference to the CodeMirror view
      if (!githubRepo || !view) return

      try {
        const fileId = Date.now().toString()
        const fileExtension = file.name.split(".").pop()
        const fileName = file.name.replace(`.${fileExtension}`, "")
        const filePath = `/${UPLOADS_DIRECTORY}/${fileId}.${fileExtension}`
        const arrayBuffer = await file.arrayBuffer()

        // Upload file
        writeFile({ githubToken, githubRepo, path: filePath, content: arrayBuffer })

        // Cache file
        fileCache.set(filePath, { file, url: URL.createObjectURL(file) })

        // Get current selection
        const { selection } = view.state
        const { from = 0, to = 0 } = selection.ranges[selection.mainIndex] ?? {}
        const selectedText = view.state.doc.sliceString(from, to)

        // Compose markdown
        let markdown = `[${selectedText || fileName}](${filePath})`

        // Use markdown image syntax if file is an image, video, or audio
        if (
          file.type.startsWith("image/") ||
          file.type.startsWith("video/") ||
          file.type.startsWith("audio/")
        ) {
          markdown = `!${markdown}`
        }

        // Prepare next selection
        let anchor: number | undefined
        let head: number | undefined

        if (selectedText) {
          // If there is a selection, move the cursor to the end of the inserted markdown
          anchor = from + markdown.length
        } else {
          // Otherwise, select the text content of the inserted markdown so it's easy to change
          anchor = from + markdown.indexOf("]")
          head = from + markdown.indexOf("[") + 1
        }

        view?.dispatch({
          // Replace the current selection with the markdown
          changes: [{ from, to, insert: markdown }],
          selection: { anchor, head },
        })

        view.focus()
      } catch (error) {
        console.error(error)
      }
    },
    [getGitHubRepo, getGitHubToken],
  )

  return attachFile
}
