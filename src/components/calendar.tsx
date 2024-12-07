import * as RovingFocusGroup from "@radix-ui/react-roving-focus"
import {
  addDays,
  eachDayOfInterval,
  getISOWeek,
  isMonday,
  nextMonday,
  nextSunday,
  parseISO,
  previousMonday,
} from "date-fns"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Link } from "@tanstack/react-router"
import { datesAtom, notesAtom } from "../global-state"
import { useNoteById } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { cx } from "../utils/cx"
import { DAY_NAMES, MONTH_NAMES, formatWeek, toDateString, toWeekString } from "../utils/date"
import { IconButton } from "./icon-button"
import { ChevronLeftIcon16, ChevronRightIcon16 } from "./icons"

export function Calendar({
  activeNoteId,
  className,
}: {
  activeNoteId: string
  className?: string
}) {
  const date = parseISO(activeNoteId)

  const [startOfWeek, setStartOfWeek] = React.useState(() =>
    isMonday(date) ? date : previousMonday(date),
  )

  const endOfWeek = React.useMemo(() => nextSunday(startOfWeek), [startOfWeek])

  const daysOfWeek = React.useMemo(
    () => eachDayOfInterval({ start: startOfWeek, end: endOfWeek }),
    [startOfWeek, endOfWeek],
  )

  return (
    <div className="border-b border-border-secondary">
      <div className={cx("-mb-px flex flex-col gap-2 overflow-hidden py-2", className)}>
        <div className="flex items-center justify-between">
          <span className="text-lg">
            <span className="font-semibold">{MONTH_NAMES[startOfWeek.getMonth()]}</span>{" "}
            {startOfWeek.getFullYear()}
          </span>
          <div className="flex ">
            <IconButton
              aria-label="Previous week"
              onClick={() => setStartOfWeek(previousMonday(startOfWeek))}
            >
              <ChevronLeftIcon16 />
            </IconButton>
            <IconButton
              aria-label="Next week"
              onClick={() => setStartOfWeek(nextMonday(startOfWeek))}
            >
              <ChevronRightIcon16 />
            </IconButton>
          </div>
        </div>
        <div className="grid">
          <RovingFocusGroup.Root orientation="horizontal" className="flex">
            <CalendarWeek
              startOfWeek={startOfWeek}
              isActive={toWeekString(startOfWeek) === activeNoteId}
            />
            <div
              role="separator"
              className="my-[0.375rem] w-px flex-shrink-0 bg-border-secondary"
            />
            {daysOfWeek.map((date) => (
              <CalendarDate
                key={date.toISOString()}
                date={date}
                isActive={toDateString(date) === activeNoteId}
              />
            ))}
          </RovingFocusGroup.Root>
        </div>
      </div>
    </div>
  )
}

function CalendarWeek({
  startOfWeek,
  isActive = false,
}: {
  startOfWeek: Date
  isActive?: boolean
}) {
  const weekString = toWeekString(startOfWeek)
  const weekNumber = getISOWeek(startOfWeek)
  const label = formatWeek(weekString)
  const note = useNoteById(weekString)
  const searchNotes = useSearchNotes()

  const hasBacklinks = React.useMemo(
    () => searchNotes(`link:"${weekString}" -id:"${weekString}"`).length > 0,
    [weekString, searchNotes],
  )

  const daysOfWeek = React.useMemo(() => {
    const endOfWeek = addDays(startOfWeek, 6)
    return eachDayOfInterval({ start: startOfWeek, end: endOfWeek }).map(toDateString)
  }, [startOfWeek])

  const hasDailyNotesAtom = React.useMemo(
    () =>
      selectAtom(notesAtom, (notes) => {
        return daysOfWeek.some((date) => Boolean(notes.get(date)))
      }),
    [daysOfWeek],
  )

  const hasNotes = useAtomValue(hasDailyNotesAtom) || hasBacklinks || Boolean(note)

  return (
    <CalendarItem
      key={weekString}
      to={`/${weekString}`}
      aria-label={label}
      name="Week"
      shortName="W"
      number={weekNumber}
      isActive={isActive}
      hasNotes={hasNotes}
    />
  )
}

function CalendarDate({ date, isActive = false }: { date: Date; isActive?: boolean }) {
  const dateString = toDateString(date)
  const note = useNoteById(dateString)
  const hasBacklinksAtom = React.useMemo(
    () => selectAtom(datesAtom, (dates) => dates[dateString]?.length > 0),
    [dateString],
  )
  const hasNotes = useAtomValue(hasBacklinksAtom) || Boolean(note)
  const dayName = DAY_NAMES[date.getDay()]
  const monthName = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const label = `${dayName}, ${monthName} ${day}, ${year}`
  const isToday = dateString === toDateString(new Date())

  return (
    <CalendarItem
      key={date.toISOString()}
      to={`/${dateString}`}
      aria-label={label}
      name={dayName.slice(0, 3)}
      shortName={dayName.slice(0, 2)}
      number={date.getDate()}
      isActive={isActive}
      isToday={isToday}
      hasNotes={hasNotes}
    />
  )
}

type CalendarItemProps = {
  "aria-label": string
  name: string
  shortName: string
  number: number
  to: string
  isActive?: boolean
  isToday?: boolean
  hasNotes?: boolean
}

function CalendarItem({
  "aria-label": ariaLabel,
  name,
  shortName,
  number,
  to,
  isActive = false,
  isToday = false,
  hasNotes = false,
}: CalendarItemProps) {
  return (
    <RovingFocusGroup.Item asChild active={isActive}>
      <Link
        to={to}
        aria-label={ariaLabel}
        className={cx(
          "focus-ring relative flex w-full cursor-pointer justify-center rounded p-4 leading-4 text-text-secondary @container hover:bg-bg-secondary",

          // Underline the active day
          isActive &&
            "font-semibold text-text before:absolute before:-bottom-2 before:h-[3px] before:w-full before:bg-text before:content-['']",

          // Show a dot if the date has notes
          hasNotes &&
            "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:content-['']",
          hasNotes && isActive && "after:bg-text",
          hasNotes && !isActive && "after:bg-border",
        )}
      >
        <div className="flex flex-col items-center gap-1 @[3rem]:flex-row @[3rem]:gap-2 coarse:gap-2">
          <span className="@[3rem]:hidden">{shortName}</span>
          {/* Show full name when there's enough space */}
          <span className="hidden @[3rem]:inline">{name}</span>
          <span
            className={cx(
              isToday && "-mx-1 -my-[0.125rem] rounded px-1 py-[0.125rem]",
              // Outline the current day
              isToday && !isActive && "shadow-[inset_0_0_0_1px_currentColor]",
              // Make outline bolder if current day is active
              isToday && isActive && "bg-text text-bg",
            )}
          >
            {number}
          </span>
        </div>
      </Link>
    </RovingFocusGroup.Item>
  )
}
