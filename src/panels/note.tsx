import { useActor } from "@xstate/react"
import React from "react"
import { NoteIcon24 } from "../components/icons"
import { NoteCard } from "../components/note-card"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { GlobalStateContext } from "../global-state"

export function NotePanel({ id, params = {}, onClose }: PanelProps) {
  const { id: noteId = "" } = params
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const backlinks = state.context.backlinks[noteId]

  return (
    <Panel id={id} title="Note" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <NoteCard id={noteId} />

        <h3 className="leading-none">Backlinks</h3>

        <NoteForm defaultBody={`[[${noteId}]]`} />
        <NoteList key={noteId} ids={backlinks || []} />
      </div>
    </Panel>
  )
}
