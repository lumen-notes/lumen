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
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { templatesAtom } from "../global-state"
import { useSearchNotes } from "../hooks/search"
import { formatDate, formatDateDistance } from "../utils/date"

export function DailyPanel({ id, params = {}, onClose }: PanelProps) {
  const { date = "" } = params
  const dailyTemplate = useDailyTemplate(date)
  const searchNotes = useSearchNotes()
  const backlinks = React.useMemo(
    () => searchNotes(`link:"${date}" -id:"${date}"`),
    [date, searchNotes],
  )

  return (
    <Panel
      id={id}
      key={date}
      title={formatDate(date)}
      description={formatDateDistance(date)}
      icon={<CalendarIcon16 number={new Date(date).getUTCDate()} />}
      onClose={onClose}
    >
      <div className="flex flex-col">
        <Calendar key={date} activeNoteId={date} />
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
          <NoteCard id={date} defaultValue={dailyTemplate} />
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
