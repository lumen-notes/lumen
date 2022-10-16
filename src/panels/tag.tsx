import { useActor } from "@xstate/react"
import React from "react"
import { TagIcon24 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { pluralize } from "../utils/pluralize"

export function TagPanel({ id, params = {}, onClose }: PanelProps) {
  const { name = "" } = params
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const noteIds = state.context.tags[name] || []

  return (
    <Panel
      id={id}
      title={`#${name}`}
      description={pluralize(noteIds.length, "note")}
      icon={<TagIcon24 />}
      onClose={onClose}
    >
      <LinkHighlightProvider href={`/tags/${name}`}>
        <div className="p-4">
          <NoteList key={name} ids={noteIds} />
        </div>
      </LinkHighlightProvider>
    </Panel>
  )
}
