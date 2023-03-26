import { useAtomValue } from "jotai"
import { noteCountAtom } from "../atoms"
import { NoteIcon24 } from "../components/icons"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"

export function NotesPanel({ id, onClose }: PanelProps) {
  const noteCount = useAtomValue(noteCountAtom)
  return (
    <Panel id={id} title="Notes" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="p-4">
        <NoteList noteCount={noteCount} />
      </div>
    </Panel>
  )
}
