import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { notesAtom } from "../global-atoms"
import { NoteId } from "../types"

export function useNoteById(id: NoteId) {
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes[id]), [id])
  const note = useAtomValue(noteAtom)
  return note
}
