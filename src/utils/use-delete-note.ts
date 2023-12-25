import { useSetAtom } from "jotai"
import { globalStateMachineAtom } from "../global-state"
import { NoteId } from "../schema"
import React from "react"

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
