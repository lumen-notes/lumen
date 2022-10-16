import { useActor } from "@xstate/react"
import React from "react"
import { NoteIcon24 } from "../components/icons"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { pluralize } from "../utils/pluralize"

export function NotesPanel({ id, onClose }: PanelProps) {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const noteIds = Object.keys(state.context.notes)

  return (
    <Panel
      id={id}
      title="Notes"
      description={pluralize(noteIds.length, "note")}
      icon={<NoteIcon24 />}
      onClose={onClose}
    >
      <div className="p-4">
        <NoteList ids={noteIds} />
      </div>
    </Panel>
  )
}
