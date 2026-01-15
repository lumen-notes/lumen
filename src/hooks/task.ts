import { useNavigate } from "@tanstack/react-router"
import { useAtomValue, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import React from "react"
import { githubRepoAtom, globalStateMachineAtom, markdownFilesAtom } from "../global-state"
import { updateFrontmatterValue } from "../utils/frontmatter"
import { getNoteDraft, setNoteDraft } from "../utils/note-draft"

/**
 * Appends a task line to note content.
 * If the note ends with a list, adds to the end of the list.
 * Otherwise, adds a blank line separator then the task.
 */
function appendTaskToNote(content: string, taskLine: string): string {
  if (!content.trim()) {
    return taskLine
  }

  const trimmed = content.trimEnd()
  const lines = trimmed.split("\n")
  const lastLine = lines[lines.length - 1] || ""

  // Check if ends with list item: "- ", "* ", "+ ", "1. " etc
  const endsWithList = /^(\s*[-*+]|\s*\d+\.)\s/.test(lastLine)

  if (endsWithList) {
    return trimmed + "\n" + taskLine
  } else {
    return trimmed + "\n\n" + taskLine
  }
}

/**
 * Adds updated_at timestamp to content
 */
function addUpdatedTimestamp(content: string): string {
  return updateFrontmatterValue({
    content,
    properties: { updated_at: new Date() },
  })
}

export function useMoveTask() {
  const getMarkdownFiles = useAtomCallback(
    React.useCallback((get) => get(markdownFilesAtom), []),
  )
  const githubRepo = useAtomValue(githubRepoAtom)
  const send = useSetAtom(globalStateMachineAtom)
  const navigate = useNavigate()

  return React.useCallback(
    (params: {
      sourceNoteId: string
      targetNoteId: string
      sourceMarkdown: string
      nodeStart: number
      nodeEnd: number
    }) => {
      const { sourceNoteId, targetNoteId, sourceMarkdown, nodeStart, nodeEnd } = params

      // Extract task from source markdown
      let start = nodeStart
      while (start > 0 && sourceMarkdown[start - 1] !== "\n") start--
      const taskLine = sourceMarkdown.slice(start, nodeEnd).trim()
      const endWithNewline = sourceMarkdown[nodeEnd] === "\n" ? nodeEnd + 1 : nodeEnd
      const newSourceContent = sourceMarkdown.slice(0, start) + sourceMarkdown.slice(endWithNewline)

      // Check for drafts
      const sourceDraft = getNoteDraft({ githubRepo, noteId: sourceNoteId })
      const targetDraft = getNoteDraft({ githubRepo, noteId: targetNoteId })
      const sourceHasDraft = sourceDraft !== null
      const targetHasDraft = targetDraft !== null

      // Build target content (use draft if exists, else saved file)
      const markdownFiles = getMarkdownFiles()
      const targetBaseContent = targetDraft ?? markdownFiles[`${targetNoteId}.md`] ?? ""
      const newTargetContent = appendTaskToNote(targetBaseContent, taskLine)

      // Update drafts for dirty files (immediate write since we navigate after)
      if (sourceHasDraft) {
        setNoteDraft({ githubRepo, noteId: sourceNoteId, value: newSourceContent, immediate: true })
      }
      if (targetHasDraft) {
        setNoteDraft({ githubRepo, noteId: targetNoteId, value: newTargetContent, immediate: true })
      }

      // Save clean files only
      const filesToSave: Record<string, string> = {}
      if (!sourceHasDraft) {
        filesToSave[`${sourceNoteId}.md`] = addUpdatedTimestamp(newSourceContent)
      }
      if (!targetHasDraft) {
        filesToSave[`${targetNoteId}.md`] = addUpdatedTimestamp(newTargetContent)
      }

      if (Object.keys(filesToSave).length > 0) {
        send({
          type: "WRITE_FILES",
          markdownFiles: filesToSave,
          commitMessage: `Move task from ${sourceNoteId}.md to ${targetNoteId}.md`,
        })
      }

      // Navigate to target note
      navigate({
        to: "/notes/$",
        params: { _splat: targetNoteId },
        search: { mode: "read", query: undefined, view: "grid" },
      })
    },
    [getMarkdownFiles, githubRepo, navigate, send],
  )
}
