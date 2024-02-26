import { addDays, eachDayOfInterval, parseISO } from "date-fns"
import ejs from "ejs"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Calendar } from "../components/calendar"
import { CalendarIcon16, LoadingIcon16, TriangleRightIcon8 } from "../components/icons"
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
import { formatWeek, formatWeekDistance, toDateString } from "../utils/date"
import { DailyNoteCard } from "./daily"

const isResolvingRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.resolvingRepo"),
)

export function WeeklyPanel({ id, params = {}, onClose }: PanelProps) {
  const { week = "" } = params
  const note = useNoteById(week)
  const isResolvingRepo = useAtomValue(isResolvingRepoAtom)
  const searchNotes = useSearchNotes()
  const backlinks = React.useMemo(
    () => searchNotes(`link:"${week}" -id:"${week}"`),
    [week, searchNotes],
  )
  const weeklyTemplate = useWeeklyTemplate(week)
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
      icon={<CalendarIcon16 date={Number(week.split("-W")[1])} />}
      onClose={onClose}
    >
      <div className="flex flex-col">
        <Calendar key={week} activeNoteId={week} />
        <div className="flex flex-col gap-4 p-4">
          {isResolvingRepo ? (
            <span className="flex items-center gap-2 text-text-secondary">
              <LoadingIcon16 />
              Loading…
            </span>
          ) : (
            <>
              {note ? (
                <NoteCard id={week} />
              ) : (
                <NoteCardForm
                  key={week}
                  minHeight="10rem"
                  id={week}
                  defaultValue={weeklyTemplate}
                />
              )}

              <details open className="group space-y-4">
                <summary className="-m-4 inline-flex cursor-pointer list-none items-center gap-2 rounded-sm p-4 text-text-secondary hover:text-text [&::-webkit-details-marker]:hidden">
                  <TriangleRightIcon8 className=" group-open:rotate-90" />
                  Days
                </summary>
                {daysOfWeek.map((date) => (
                  <DailyNoteCard key={date} id={date} />
                ))}
              </details>

              {backlinks.length > 0 ? (
                <details open className="group space-y-4">
                  <summary className="-m-4 inline-flex cursor-pointer list-none items-center gap-2 rounded-sm p-4 text-text-secondary hover:text-text [&::-webkit-details-marker]:hidden">
                    <TriangleRightIcon8 className=" group-open:rotate-90" />
                    Backlinks
                  </summary>
                  <LinkHighlightProvider href={`/${week}`}>
                    <NoteList baseQuery={`link:"${week}" -id:"${week}"`} />
                  </LinkHighlightProvider>
                </details>
              ) : null}
            </>
          )}
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
