import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { NoteIcon24 } from "../components/icons"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { rawNotesAtom } from "../global-atoms"
import { NoteCardForm } from "../components/note-card-form"

export function NotesPanel({ id, onClose }: PanelProps) {
  const noteCountAtom = React.useMemo(
    () => selectAtom(rawNotesAtom, (rawNotes) => Object.keys(rawNotes).length),
    [],
  )
  const noteCount = useAtomValue(noteCountAtom)

  return (
    <Panel id={id} title="Notes" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="p-4">
        {noteCount === 0 ? (
          <NoteCardForm placeholder="Write your first note…" minHeight="12rem" />
        ) : (
          <NoteList noteCount={noteCount} />
        )}
      </div>
    </Panel>
  )
}
