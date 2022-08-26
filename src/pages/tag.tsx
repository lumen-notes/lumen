import { useActor } from "@xstate/react"
import React from "react"
import { useParams } from "react-router-dom"
import { Card } from "../components/card"
import { TagIcon24 } from "../components/icons"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { GlobalStateContext } from "../global-state"
import { pluralize } from "../utils/pluralize"

export function TagPage() {
  const { name = "" } = useParams()
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const noteIds = state.context.tags[name] || []

  return (
    <div className="flex max-w-lg flex-col gap-4 p-4">
      <div className="flex gap-2">
        <TagIcon24 />
        <div className="flex items-baseline gap-1">
          <h2 className="text-lg font-semibold leading-[24px]">#{name}</h2>
          <span className="text-text-muted" aria-hidden>
            ·
          </span>
          <span className="text-text-muted">
            {pluralize(noteIds.length, "note")}
          </span>
        </div>
      </div>

      <Card className="p-2">
        <NoteForm defaultBody={`#${name}`} />
      </Card>

      <NoteList key={name} ids={noteIds} />
    </div>
  )
}
