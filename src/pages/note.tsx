import { useActor } from "@xstate/react"
import React from "react"
import { useParams } from "react-router-dom"
import { Card } from "../components/card"
import { NoteIcon24 } from "../components/icons"
import { NoteCard } from "../components/note-card"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { GlobalStateContext } from "../global-state"

export function NotePage() {
  const { id = "" } = useParams()
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const backlinks = state.context.backlinks[id]

  return (
    <Panel title="Note" icon={<NoteIcon24 />}>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <NoteCard id={id} />

        <h3 className="leading-none">Backlinks</h3>

        <NoteForm defaultBody={`[[${id}]]`} />
        <NoteList key={id} ids={backlinks || []} />
      </div>
    </Panel>
  )
}
