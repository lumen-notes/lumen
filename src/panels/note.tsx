import { useActor } from "@xstate/react"
import React from "react"
import { NoteIcon24 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { GlobalStateContext } from "../global-state"

export function NotePanel({ id, params = {}, onClose }: PanelProps) {
  const { id: noteId = "" } = params
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const { title = "" } = state.context.notes[noteId] || {}
  const backlinks = state.context.backlinks[noteId]

  return (
    <Panel id={id} title={title || "Note"} icon={<NoteIcon24 />} onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        <NoteCard id={noteId} />

        <h3 className="leading-none">Backlinks</h3>

        <LinkHighlightProvider href={`/${noteId}`}>
          <NoteList key={noteId} ids={backlinks || []} />
        </LinkHighlightProvider>
      </div>
    </Panel>
  )
}
