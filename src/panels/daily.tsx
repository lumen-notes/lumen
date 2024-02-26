import * as RovingFocusGroup from "@radix-ui/react-roving-focus"
import { eachDayOfInterval, isMonday, nextMonday, nextSunday, previousMonday } from "date-fns"
import { toDate } from "date-fns-tz"
import ejs from "ejs"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { IconButton } from "../components/icon-button"
import {
  CalendarIcon16,
  ChevronLeftIcon16,
  ChevronRightIcon16,
  TriangleRightIcon8,
} from "../components/icons"
import { removeFrontmatterComments } from "../components/insert-template"
import { Link } from "../components/link"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { datesAtom, globalStateMachineAtom, templatesAtom } from "../global-state"
import { useNoteById } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { cx } from "../utils/cx"
import { DAY_NAMES, MONTH_NAMES, formatDate, formatDateDistance, toDateString } from "../utils/date"

const isResolvingRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.resolvingRepo"),
)

export function DailyPanel({ id, params = {}, onClose }: PanelProps) {
  const { date = "" } = params
  const note = useNoteById(date)
  const isResolvingRepo = useAtomValue(isResolvingRepoAtom)
  const searchNotes = useSearchNotes()
  const backlinks = React.useMemo(
    () => searchNotes(`link:"${date}" -id:"${date}"`),
    [date, searchNotes],
  )
  const dailyTemplate = useDailyTemplate(date)

  return (
    <Panel
      id={id}
      title={formatDate(date)}
      description={formatDateDistance(date)}
      icon={<CalendarIcon16 date={new Date(date).getUTCDate()} />}
      onClose={onClose}
    >
      <div className="flex flex-col">
        <Calendar key={date} activeDate={date} />
        <div className="flex flex-col gap-4 p-4">
          {!isResolvingRepo && !note ? (
            <NoteCardForm key={date} minHeight="10rem" id={date} defaultValue={dailyTemplate} />
          ) : (
            <NoteCard id={date} />
          )}
          {backlinks.length > 0 ? (
            <details open className="group space-y-4">
              <summary className="-m-4 inline-flex cursor-pointer list-none items-center gap-2 rounded-sm p-4 text-text-secondary hover:text-text [&::-webkit-details-marker]:hidden">
                <TriangleRightIcon8 className=" group-open:rotate-90" />
                Backlinks
              </summary>
              <LinkHighlightProvider href={`/${date}`}>
                <NoteList baseQuery={`link:"${date}" -id:"${date}"`} />
              </LinkHighlightProvider>
            </details>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}

function useDailyTemplate(date: string) {
  const dailyTemplateAtom = React.useMemo(
    () =>
      selectAtom(templatesAtom, (templates) =>
        Object.values(templates).find((t) => t.name.match(/^daily$/i)),
      ),
    [],
  )

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

export function Calendar({ activeDate: dateString }: { activeDate: string }) {
  const date = toDate(dateString)

  const [startOfWeek, setStartOfWeek] = React.useState(() =>
    isMonday(date) ? date : previousMonday(date),
  )

  const endOfWeek = nextSunday(startOfWeek)

  const week = eachDayOfInterval({ start: startOfWeek, end: endOfWeek })

  return (
    <div className="flex flex-col gap-2 overflow-hidden px-2 py-2 shadow-[inset_0_-1px_0_var(--color-border-secondary)]">
      <div className="flex items-center justify-between">
        <span className="px-2 text-lg font-semibold">
          {MONTH_NAMES[startOfWeek.getMonth()]} {startOfWeek.getFullYear()}
        </span>

        <RovingFocusGroup.Root orientation="horizontal">
          <RovingFocusGroup.Item asChild>
            <IconButton
              aria-label="Previous week"
              onClick={() => setStartOfWeek(previousMonday(startOfWeek))}
            >
              <ChevronLeftIcon16 />
            </IconButton>
          </RovingFocusGroup.Item>
          <RovingFocusGroup.Item asChild>
            <IconButton
              aria-label="Next week"
              onClick={() => setStartOfWeek(nextMonday(startOfWeek))}
            >
              <ChevronRightIcon16 />
            </IconButton>
          </RovingFocusGroup.Item>
        </RovingFocusGroup.Root>
      </div>
      <div className="grid">
        <RovingFocusGroup.Root orientation="horizontal" className="flex">
          {week.map((date) => (
            <CalendarDate
              key={date.toISOString()}
              date={date}
              isActive={toDateString(date) === dateString}
            />
          ))}
        </RovingFocusGroup.Root>
      </div>
    </div>
  )
}

function CalendarDate({ date, isActive = false }: { date: Date; isActive?: boolean }) {
  const note = useNoteById(toDateString(date))
  const hasBacklinksAtom = React.useMemo(
    () => selectAtom(datesAtom, (dates) => dates[toDateString(date)]?.length > 0),
    [date],
  )
  const hasNotes = useAtomValue(hasBacklinksAtom) || Boolean(note)
  const dayName = DAY_NAMES[date.getDay()]
  const monthName = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const label = `${dayName}, ${monthName} ${day}, ${year}`
  const isToday = toDateString(date) === toDateString(new Date())

  return (
    <RovingFocusGroup.Item asChild active={isActive}>
      <Link
        key={date.toISOString()}
        to={`/${toDateString(date)}`}
        aria-label={label}
        className={cx(
          "focus-ring relative flex w-full cursor-pointer justify-center rounded-sm p-4 leading-4 text-text-secondary @container hover:bg-bg-secondary",

          // Underline the active day
          isActive &&
            "font-semibold text-text before:absolute before:-bottom-2 before:h-[0.125rem] before:w-full before:bg-text before:content-['']",

          // Show a dot if the date has notes
          hasNotes &&
            "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:content-['']",
          hasNotes && isActive && "after:bg-text",
          hasNotes && !isActive && "after:bg-border",
        )}
      >
        <div className="flex flex-col items-center gap-1 @[6rem]:flex-row @[6rem]:gap-2 coarse:gap-2">
          <span className="@[6rem]:hidden">{dayName.slice(0, 2)}</span>
          {/* Show the first 3 letters of the day name when there's enough space */}
          <span className="hidden @[6rem]:inline">{dayName.slice(0, 3)}</span>
          <span
            className={cx(
              isToday && "-mx-1 -my-[0.125rem] rounded-sm px-1 py-[0.125rem]",
              // Outline the current day
              isToday && !isActive && "shadow-[inset_0_0_0_1px_currentColor]",
              // Make outline bolder if current day is active
              isToday && isActive && "bg-text text-bg",
            )}
          >
            {date.getDate()}
          </span>
        </div>
      </Link>
    </RovingFocusGroup.Item>
  )
}
