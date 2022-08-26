import { useActor } from "@xstate/react"
import React from "react"
import { useParams } from "react-router-dom"
import { Card } from "../components/card"
import { NoteIcon24 } from "../components/icons"
import { NoteCard } from "../components/note-card"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { GlobalStateContext } from "../global-state"

export function NotePage() {
  const { id = "" } = useParams()
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const backlinks = state.context.backlinks[id]

  return (
    <div className="flex max-w-lg flex-col gap-4 p-4">
      <div className="flex gap-2">
        <NoteIcon24 />
        <h2 className="text-lg font-semibold leading-[24px]">Note</h2>
      </div>

      <NoteCard id={id} />

      <h3 className="leading-none">Backlinks</h3>

      <Card className="p-2">
        <NoteForm defaultBody={`[[${id}]]`} />
      </Card>

      <NoteList key={id} ids={backlinks || []} />
    </div>
  )
}
