import ejs from "ejs"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Calendar } from "../components/calendar"
import { Details } from "../components/details"
import { CalendarIcon16 } from "../components/icons"
import { removeFrontmatterComments } from "../components/insert-template"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { globalStateMachineAtom, templatesAtom } from "../global-state"
import { useNoteById } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { NoteId } from "../schema"
import { formatDate, formatDateDistance } from "../utils/date"

const isResolvingRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.resolvingRepo"),
)

export function DailyPanel({ id, params = {}, onClose }: PanelProps) {
  const { date = "" } = params
  const searchNotes = useSearchNotes()
  const backlinks = React.useMemo(
    () => searchNotes(`link:"${date}" -id:"${date}"`),
    [date, searchNotes],
  )

  return (
    <Panel
      id={id}
      title={formatDate(date)}
      description={formatDateDistance(date)}
      icon={<CalendarIcon16 number={new Date(date).getUTCDate()} />}
      onClose={onClose}
    >
      <div className="flex flex-col">
        <Calendar key={date} activeNoteId={date} />
        <div className="flex flex-col gap-4 p-4">
          <DailyNoteCard id={date} />
          {backlinks.length > 0 ? (
            <Details>
              <Details.Summary>Backlinks</Details.Summary>
              <LinkHighlightProvider href={`/${date}`}>
                <NoteList baseQuery={`link:"${date}" -id:"${date}"`} />
              </LinkHighlightProvider>
            </Details>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}

function DailyNoteCard({ id }: { id: NoteId }) {
  const note = useNoteById(id)
  const dailyTemplate = useDailyTemplate(id)
  const isResolvingRepo = useAtomValue(isResolvingRepoAtom)

  if (!isResolvingRepo && !note) {
    return <NoteCardForm key={id} minHeight="10rem" id={id} defaultValue={dailyTemplate} />
  }

  return <NoteCard id={id} />
}

const dailyTemplateAtom = selectAtom(templatesAtom, (templates) =>
  Object.values(templates).find((t) => t.name.match(/^daily$/i)),
)

export function useDailyTemplate(date: string) {
  const dailyTemplate = useAtomValue(dailyTemplateAtom)

  const renderedDailyTemplate = React.useMemo(() => {
    if (!dailyTemplate) return ""

    let text = ejs.render(dailyTemplate.body, { date })
    text = removeFrontmatterComments(text)
    text = text.replace("{cursor}", "")
    return text
  }, [dailyTemplate, date])

  return renderedDailyTemplate
}
