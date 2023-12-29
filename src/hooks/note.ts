import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { globalStateMachineAtom, notesAtom } from "../global-state"
import { Note, NoteId } from "../schema"

export function useNoteById(id: NoteId) {
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes.get(id)), [id])
  const note = useAtomValue(noteAtom)
  return note
}

export function useSaveNote() {
  const send = useSetAtom(globalStateMachineAtom)

  const saveNote = React.useCallback(
    ({ id, content }: Pick<Note, "id" | "content">) => {
      send({
        type: "WRITE_FILES",
        markdownFiles: { [`${id}.md`]: content },
      })
    },
    [send],
  )

  return saveNote
}

export function useDeleteNote() {
  const send = useSetAtom(globalStateMachineAtom)

  const deleteNote = React.useCallback(
    (id: NoteId) => {
      send({ type: "DELETE_FILE", filepath: `${id}.md` })
    },
    [send],
  )

  return deleteNote
}
