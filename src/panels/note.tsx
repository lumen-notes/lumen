import { Details } from "../components/details"
import { NoteIcon16, NoteTemplateIcon16 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteCardForm } from "../components/note-card-form"
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
      title={note ? "Note" : "New note"}
      icon={note ? <NoteIcon16 /> : <NoteTemplateIcon16 />}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 p-4">
        {note ? <NoteCard id={noteId} /> : <NoteCardForm id={noteId} />}
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
