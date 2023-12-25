import { Getter, useSetAtom } from "jotai"
import { selectAtom, useAtomCallback } from "jotai/utils"
import React from "react"
import { globalStateMachineAtom } from "../global-state"

const markdownFilesAtom = selectAtom(globalStateMachineAtom, (state) => state.context.markdownFiles)
const markdownFilesCallback = (get: Getter) => get(markdownFilesAtom)

export function useRenameTag() {
  const getMarkdownFiles = useAtomCallback(markdownFilesCallback)
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
  const getMarkdownFiles = useAtomCallback(markdownFilesCallback)
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

/** Rename or delete a tag in a markdown file */
export function updateTag({
  fileContent,
  oldName,
  newName,
}: {
  fileContent: string
  oldName: string
  newName: string | null // null means delete
}): string {
  // Replace the old tag name with the new one in the file content
  let updatedContent = fileContent.replace(
    new RegExp(`#${oldName}\\b`, "g"),
    newName ? `#${newName}` : "",
  )

  // Replace the old tag name with the new one in the frontmatter
  const frontmatterTagsRegex = /tags: \[(.*?)\]/g
  const matches = frontmatterTagsRegex.exec(fileContent)
  if (matches && matches[1]) {
    const tags = matches[1].split(",").map((tag) => tag.trim())
    const updatedTags = tags
      .map((tag) => (tag === oldName ? newName : tag))
      .filter(Boolean)
      .join(", ")
    updatedContent = updatedContent.replace(frontmatterTagsRegex, `tags: [${updatedTags}]`)
  }

  return updatedContent
}
