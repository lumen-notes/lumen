import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { NoteIcon24 } from "../components/icons"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { rawNotesAtom } from "../global-atoms"

export function NotesPanel({ id, onClose }: PanelProps) {
  const noteCountAtom = selectAtom(rawNotesAtom, (rawNotes) => Object.keys(rawNotes).length)
  const noteCount = useAtomValue(noteCountAtom)

  return (
    <Panel id={id} title="Notes" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="p-4">
        <NoteList noteCount={noteCount} />
      </div>
    </Panel>
  )
}
