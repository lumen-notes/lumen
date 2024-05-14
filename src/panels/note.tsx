import { Details } from "../components/details"
import { NoteIcon16 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { useNoteById } from "../hooks/note"
import { isValidDateString, isValidWeekString } from "../utils/date"
import { DailyPanel } from "./daily"
import { WeeklyPanel } from "./weekly"

export function NotePanel({ id, params = {}, onClose }: PanelProps) {
  const { "*": noteId = "" } = params
  const note = useNoteById(noteId)

  if (isValidDateString(noteId)) {
    return <DailyPanel id={id} params={{ date: noteId }} onClose={onClose} />
  }

  if (isValidWeekString(noteId)) {
    return <WeeklyPanel id={id} params={{ week: noteId }} onClose={onClose} />
  }

  return (
    <Panel
      id={id}
      key={noteId}
      title={!note ? "New note" : "Note"}
      icon={<NoteIcon16 />}
      onClose={onClose}
    >
      <div className="flex w-full flex-col gap-4 p-4">
        <NoteCard id={noteId} />
        {note?.backlinks?.length ? (
          <Details>
            <Details.Summary>Backlinks</Details.Summary>
            <LinkHighlightProvider href={`/${noteId}`}>
              <NoteList baseQuery={`link:"${noteId}" -id:"${noteId}"`} />
            </LinkHighlightProvider>
          </Details>
        ) : null}
      </div>
    </Panel>
  )
}
