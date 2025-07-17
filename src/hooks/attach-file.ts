import { useAtomCallback } from "jotai/utils"
import React from "react"
import { githubRepoAtom, githubUserAtom } from "../global-state"
import { fs, writeFile } from "../utils/fs"
import { gitAdd, gitCommit, getRepoDir } from "../utils/git"
import { EditorView } from "@codemirror/view"

export const UPLOADS_DIR = "/uploads"

export function useAttachFile() {
  const getGitHubUser = useAtomCallback(React.useCallback((get) => get(githubUserAtom), []))
  const getGitHubRepo = useAtomCallback(React.useCallback((get) => get(githubRepoAtom), []))

  const attachFile = React.useCallback(
    async (file: File, view?: EditorView) => {
      // Skip if offline
      if (!navigator.onLine) return

      const githubUser = getGitHubUser()
      const githubRepo = getGitHubRepo()

      // We can't upload a file if we don't know where to upload it
      // or if we don't have a reference to the CodeMirror view
      if (!githubUser || !githubRepo || !view) return

      try {
        const id = Date.now().toString()
        const extension = file.name.split(".").pop()
        const name = file.name.replace(`.${extension}`, "")
        const path = `${UPLOADS_DIR}/${id}.${extension}`
        const arrayBuffer = await file.arrayBuffer()

        // Make sure the uploads directory exists
        const repoDir = getRepoDir(githubRepo)
        try {
          await fs.promises.mkdir(`${repoDir}${UPLOADS_DIR}`)
        } catch (error) {
          // Directory already exists, ignore error
        }

        // Write file to file system
        writeFile({ repo: githubRepo, path, content: arrayBuffer, githubUser, githubRepo })
          // Use `.then()` to avoid blocking the rest of the function
          .then(async () => {
            // Remove the leading slash from the path
            const relativePath = path.replace(/^\//, "")

            // Stage file
            await gitAdd(githubRepo, [relativePath])

            // Commit file
            await gitCommit(githubRepo, `Update ${relativePath}`)
          })
          .catch((error) => {
            console.error(error)
          })

        // Cache file
        fileCache.set(path, { file, url: URL.createObjectURL(file) })

        // Get current selection
        const { selection } = view.state
        const { from = 0, to = 0 } = selection.ranges[selection.mainIndex] ?? {}

        // Insert markdown link
        const markdownLink = `![${name}](${path})`
        view.dispatch({
          changes: { from, to, insert: markdownLink },
          selection: { anchor: from + markdownLink.length },
        })
      } catch (error) {
        console.error(error)
      }
    },
    [getGitHubUser, getGitHubRepo],
  )

  return attachFile
}

// Keep track of files that have been uploaded
const fileCache = new Map<string, { file: File; url: string }>()

export function getCachedFile(path: string) {
  return fileCache.get(path)
}
