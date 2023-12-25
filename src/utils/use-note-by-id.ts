import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { notesAtom } from "../global-state"
import { NoteId } from "../schema"

export function useNoteById(id: NoteId) {
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes.get(id)), [id])
  const note = useAtomValue(noteAtom)
  return note
}
