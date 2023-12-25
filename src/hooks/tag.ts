import { useSetAtom } from "jotai"
import { selectAtom, useAtomCallback } from "jotai/utils"
import React from "react"
import { globalStateMachineAtom } from "../global-state"
import { updateTag } from "../utils/update-tag"

const markdownFilesAtom = selectAtom(globalStateMachineAtom, (state) => state.context.markdownFiles)

export function useRenameTag() {
  const getMarkdownFiles = useAtomCallback(React.useCallback((get) => get(markdownFilesAtom), []))
  const send = useSetAtom(globalStateMachineAtom)

  return React.useCallback(
    async (oldName: string, newName: string) => {
      const markdownFiles = getMarkdownFiles()
      const updatedMarkdownFiles: Record<string, string> = {}

      for (const [filepath, content] of Object.entries(markdownFiles)) {
        const newContent = updateTag({ fileContent: content, oldName, newName })

        if (newContent !== content) {
          updatedMarkdownFiles[filepath] = newContent
        }
      }

      send({
        type: "WRITE_FILES",
        markdownFiles: updatedMarkdownFiles,
        commitMessage: `Rename tag #${oldName} to #${newName}`,
      })
    },
    [getMarkdownFiles, send],
  )
}

export function useDeleteTag() {
  const getMarkdownFiles = useAtomCallback(React.useCallback((get) => get(markdownFilesAtom), []))
  const send = useSetAtom(globalStateMachineAtom)

  return React.useCallback(
    async (tagName: string) => {
      const markdownFiles = getMarkdownFiles()
      const updatedMarkdownFiles: Record<string, string> = {}

      for (const [filepath, content] of Object.entries(markdownFiles)) {
        const newContent = updateTag({ fileContent: content, oldName: tagName, newName: null })

        if (newContent !== content) {
          updatedMarkdownFiles[filepath] = newContent
        }
      }

      send({
        type: "WRITE_FILES",
        markdownFiles: updatedMarkdownFiles,
        commitMessage: `Delete tag #${tagName}`,
      })
    },
    [getMarkdownFiles, send],
  )
}
