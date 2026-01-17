import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom, useAtomCallback } from "jotai/utils"
import React from "react"
import {
  backlinksIndexAtom,
  githubRepoAtom,
  githubUserAtom,
  globalStateMachineAtom,
  notesAtom,
} from "../global-state"
import { Note, NoteId } from "../schema"
import { parseFrontmatter, updateFrontmatterValue } from "../utils/frontmatter"
import { deleteGist, updateGist } from "../utils/gist"
import { parseNote } from "../utils/parse-note"

const EMPTY_BACKLINKS: NoteId[] = []

const shallowEqualBacklinks = (a: NoteId[], b: NoteId[]) => {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function useNoteById(id: NoteId | undefined) {
  const noteAtom = React.useMemo(
    () => selectAtom(notesAtom, (notes) => (id ? notes.get(id) : undefined)),
    [id],
  )
  const note = useAtomValue(noteAtom)
  return note
}

/** Get backlinks for any note ID, even if the note doesn't exist */
export function useBacklinksForId(id: NoteId | undefined) {
  const backlinksAtom = React.useMemo(
    () =>
      selectAtom(
        backlinksIndexAtom,
        (index) => (id ? index.get(id) ?? EMPTY_BACKLINKS : EMPTY_BACKLINKS),
        shallowEqualBacklinks,
      ),
    [id],
  )
  return useAtomValue(backlinksAtom)
}

export function useSaveNote() {
  const send = useSetAtom(globalStateMachineAtom)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)

  const saveNote = React.useCallback(
    async ({ id, content }: Pick<Note, "id" | "content">) => {
      // Add updated_at timestamp to frontmatter
      const contentWithTimestamp = updateFrontmatterValue({
        content,
        properties: { updated_at: new Date() },
      })

      send({
        type: "WRITE_FILES",
        markdownFiles: { [`${id}.md`]: contentWithTimestamp },
      })

      // If the note has a gist ID, update the gist
      const { frontmatter } = parseFrontmatter(contentWithTimestamp)
      if (typeof frontmatter.gist_id === "string" && githubUser && githubRepo) {
        await updateGist({
          gistId: frontmatter.gist_id,
          note: parseNote(id ?? "", contentWithTimestamp),
          githubUser,
          githubRepo,
        })
      }
    },
    [send, githubUser, githubRepo],
  )

  return saveNote
}

export function useDeleteNote() {
  const send = useSetAtom(globalStateMachineAtom)
  const githubUser = useAtomValue(githubUserAtom)
  const getNoteById = useAtomCallback(
    React.useCallback((get, set, id: NoteId) => {
      const notes = get(notesAtom)
      return notes.get(id)
    }, []),
  )

  const deleteNote = React.useCallback(
    async (id: NoteId) => {
      // If the note has a gist ID, delete the gist
      const note = getNoteById(id)
      if (typeof note?.frontmatter.gist_id === "string" && githubUser?.token) {
        await deleteGist({
          githubToken: githubUser.token,
          gistId: note.frontmatter.gist_id,
        })
      }

      send({ type: "DELETE_FILE", filepath: `${id}.md` })
    },
    [send, githubUser, getNoteById],
  )

  return deleteNote
}
