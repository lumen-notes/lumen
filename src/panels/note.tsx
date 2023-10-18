import { NoteIcon16, TriangleRightIcon8 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { DATE_REGEX } from "../utils/date"
import { useNoteById } from "../utils/use-note-by-id"
import { DatePanel } from "./date"

export function NotePanel({ id, params = {}, onClose }: PanelProps) {
  const { "*": noteId = "" } = params
  const note = useNoteById(noteId)

  if (DATE_REGEX.test(noteId)) {
    return <DatePanel id={id} params={{ date: noteId }} onClose={onClose} />
  }

  return (
    <Panel id={id} title="Note" icon={<NoteIcon16 />} onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        <NoteCard id={noteId} />
        {note?.backlinks?.length ? (
          <details open className="group space-y-4">
            <summary className="-m-4 inline-flex cursor-pointer list-none items-center gap-2 rounded-sm p-4 text-text-secondary hover:text-text">
              <TriangleRightIcon8 className=" group-open:rotate-90" />
              Backlinks
            </summary>
            <LinkHighlightProvider href={`/${noteId}`}>
              <NoteList baseQuery={`link:"${noteId}" -id:"${noteId}`} />
            </LinkHighlightProvider>
          </details>
        ) : null}
      </div>
    </Panel>
  )
}
