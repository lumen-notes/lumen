import { useActor } from "@xstate/react"
import React from "react"
import { CommandMenu } from "../components/command-menu"
import { NoteIcon24 } from "../components/icons"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { Panels } from "../components/panels"
import { GlobalStateContext } from "../global-state"

export function NotesPage() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const noteIds = Object.keys(state.context.notes)

  return (
    <Panels>
      <CommandMenu />
      <Panel title="Notes" icon={<NoteIcon24 />}>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <NoteForm />
          <NoteList ids={noteIds} />
        </div>
      </Panel>
      <Panels.Outlet />
    </Panels>
  )
}
