import { useSetAtom } from "jotai"
import { globalStateMachineAtom } from "../global-state"
import { Note } from "../schema"
import React from "react"

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
