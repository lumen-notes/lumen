import { addDays, eachDayOfInterval, parseISO } from "date-fns"
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
import { useNoteById } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { NoteId } from "../schema"
import { formatWeek, formatWeekDistance, toDateString } from "../utils/date"
import { useDailyTemplate } from "./daily"

export function WeeklyPanel({ id, params = {}, onClose }: PanelProps) {
  const { week = "" } = params
  const weeklyTemplate = useWeeklyTemplate(week)
  const searchNotes = useSearchNotes()
  const hasBacklinks = React.useMemo(
    () => searchNotes(`link:"${week}" -id:"${week}"`).length > 0,
    [week, searchNotes],
  )
  const daysOfWeek = React.useMemo(() => {
    const startOfWeek = parseISO(week)
    const endOfWeek = addDays(startOfWeek, 6)
    return eachDayOfInterval({ start: startOfWeek, end: endOfWeek }).map(toDateString)
  }, [week])

  return (
    <Panel
      id={id}
      title={formatWeek(week)}
      description={formatWeekDistance(week)}
      icon={<CalendarIcon16 number={Number(week.split("-W")[1])} />}
      onClose={onClose}
    >
      <div className="flex flex-col">
        <Calendar key={week} activeNoteId={week} />
        <div className="flex flex-col gap-4 p-4">
          <NoteCard id={week} defaultValue={weeklyTemplate} />

          <Details>
            <Details.Summary>Days</Details.Summary>
            {daysOfWeek.map((date) => (
              <DailyNoteCard key={date} id={date} />
            ))}
          </Details>

          {hasBacklinks ? (
            <Details>
              <Details.Summary>Backlinks</Details.Summary>
              <LinkHighlightProvider href={`/${week}`}>
                <NoteList baseQuery={`link:"${week}" -id:"${week}"`} />
              </LinkHighlightProvider>
            </Details>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}

const weeklyTemplateAtom = selectAtom(templatesAtom, (templates) =>
  Object.values(templates).find((t) => t.name.match(/^weekly$/i)),
)

function useWeeklyTemplate(week: string) {
  const weeklyTemplate = useAtomValue(weeklyTemplateAtom)

  const renderedWeeklyTemplate = React.useMemo(() => {
    if (!weeklyTemplate) return ""

    let text = ejs.render(weeklyTemplate.body, { week })
    text = removeFrontmatterComments(text)
    text = text.replace("{cursor}", "")
    return text
  }, [weeklyTemplate, week])

  return renderedWeeklyTemplate
}

function DailyNoteCard({ id }: { id: NoteId }) {
  const note = useNoteById(id)
  const dailyTemplate = useDailyTemplate(id)
  const [showForm, setShowForm] = React.useState(false)

  if (!note) {
    return showForm ? (
      <NoteCard key={id} id={id} defaultValue={dailyTemplate} onCancel={() => setShowForm(false)} />
    ) : (
      // Note card placeholder
      <button
        className="filepath flex h-12 w-full items-center rounded-lg border border-dashed border-border bg-clip-border px-4 text-text-secondary hover:bg-bg-secondary focus-visible:border-solid focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-focus coarse:h-14"
        onClick={() => setShowForm(true)}
      >
        {id}.md
      </button>
    )
  }

  return <NoteCard id={id} />
}
