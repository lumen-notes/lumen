import { NoteIcon24 } from "../components/icons"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { GlobalStateContext } from "../global-state.machine"

export function NotesPanel({ id, onClose }: PanelProps) {
  const [state] = GlobalStateContext.useActor()
  return (
    <Panel id={id} title="Notes" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="p-4">
        <NoteList noteCount={Object.keys(state.context.notes).length} />
      </div>
    </Panel>
  )
}
