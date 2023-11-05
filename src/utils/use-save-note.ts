import { useSetAtom } from "jotai"
import { globalStateMachineAtom } from "../global-state"
import { Note } from "../types"
import React from "react"

export function useSaveNote() {
  const send = useSetAtom(globalStateMachineAtom)

  const saveNote = React.useCallback(
    ({ id, rawBody }: Pick<Note, "id" | "rawBody">) => {
      send({ type: "WRITE_FILE", filepath: `${id}.md`, content: rawBody })
    },
    [send],
  )

  return saveNote
}
