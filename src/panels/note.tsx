import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { notesAtom } from "../global-atoms"
import { NoteIcon24 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"

export function NotePanel({ id, params = {}, onClose }: PanelProps) {
  const { id: noteId = "" } = params
  const backlinksCountAtom = React.useMemo(
    () => selectAtom(notesAtom, (notes) => notes[noteId]?.backlinks.length ?? 0),
    [noteId],
  )
  const backlinksCount = useAtomValue(backlinksCountAtom)

  return (
    <Panel id={id} title="Note" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        <NoteCard id={noteId} />

        {backlinksCount > 0 ? (
          <>
            <h3 className="leading-none">Backlinks</h3>
            <LinkHighlightProvider href={`/${noteId}`}>
              <NoteList key={noteId} baseQuery={`link:${noteId}`} noteCount={backlinksCount} />
            </LinkHighlightProvider>
          </>
        ) : null}
      </div>
    </Panel>
  )
}
