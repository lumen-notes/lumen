import * as RovingFocusGroup from "@radix-ui/react-roving-focus"
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  getISOWeek,
  isMonday,
  nextSunday,
  parseISO,
  previousMonday,
} from "date-fns"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Link, useSearch } from "@tanstack/react-router"
import { datesAtom, notesAtom } from "../global-state"
import { useNoteById } from "../hooks/note"
import { useSearchNotes } from "../hooks/search-notes"
import { cx } from "../utils/cx"
import { DAY_NAMES, MONTH_NAMES, formatWeek, toDateString, toWeekString } from "../utils/date"
import { IconButton } from "./icon-button"
import { ChevronDownIcon16, ChevronUpIcon16, UndoIcon16 } from "./icons"

export function Calendar({
  activeNoteId,
  className,
}: {
  activeNoteId: string
  className?: string
}) {
  const date = parseISO(activeNoteId)

  // Local state for the displayed week (independent of activeNoteId)
  const [displayedWeekStart, setDisplayedWeekStart] = React.useState(() =>
    isMonday(date) ? date : previousMonday(date),
  )

  // Sync displayed week when activeNoteId changes (adjust state during render)
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevActiveNoteId, setPrevActiveNoteId] = React.useState(activeNoteId)
  if (activeNoteId !== prevActiveNoteId) {
    setPrevActiveNoteId(activeNoteId)
    const newDate = parseISO(activeNoteId)
    setDisplayedWeekStart(isMonday(newDate) ? newDate : previousMonday(newDate))
  }

  const endOfWeek = React.useMemo(() => nextSunday(displayedWeekStart), [displayedWeekStart])

  const daysOfWeek = React.useMemo(
    () => eachDayOfInterval({ start: displayedWeekStart, end: endOfWeek }),
    [displayedWeekStart, endOfWeek],
  )

  const navigateByWeek = React.useCallback((direction: "previous" | "next") => {
    const increment = direction === "next" ? 1 : -1
    setDisplayedWeekStart((prev) => addWeeks(prev, increment))
  }, [])

  // Check if displayed week differs from active note's week
  const activeWeekStart = React.useMemo(
    () => (isMonday(date) ? date : previousMonday(date)),
    [date],
  )
  const canReset = toWeekString(displayedWeekStart) !== toWeekString(activeWeekStart)

  const resetToActiveWeek = React.useCallback(() => {
    setDisplayedWeekStart(activeWeekStart)
  }, [activeWeekStart])

  return (
    <div className={cx("ring-1 ring-border-secondary p-2 rounded-xl", className)}>
      <div className="flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="font-content px-2">
            {MONTH_NAMES[displayedWeekStart.getMonth()]} {displayedWeekStart.getFullYear()}
          </span>
          <div className="flex">
            {canReset ? (
              <IconButton aria-label="Back to selected week" onClick={resetToActiveWeek}>
                <UndoIcon16 />
              </IconButton>
            ) : null}

            <IconButton aria-label="Previous week" onClick={() => navigateByWeek("previous")}>
              <ChevronUpIcon16 />
            </IconButton>
            <IconButton aria-label="Next week" onClick={() => navigateByWeek("next")}>
              <ChevronDownIcon16 />
            </IconButton>
            {/*<DropdownMenu>
              <DropdownMenu.Trigger
                render={
                  <IconButton aria-label="Layout">
                    <CalendarIcon16 />
                  </IconButton>
                }
              />
              <DropdownMenu.Content align="end" width={160}>
                <DropdownMenu.Item onClick={() => setLayout("week")} selected={layout === "week"}>
                  Week
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => setLayout("month")} selected={layout === "month"}>
                  Month
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>*/}
          </div>
        </div>
        <div className="grid">
          <RovingFocusGroup.Root orientation="horizontal" className="flex gap-1.5 items-center">
            <CalendarWeek
              startOfWeek={displayedWeekStart}
              isActive={toWeekString(displayedWeekStart) === activeNoteId}
            />
            <div role="separator" className="h-8 w-px flex-shrink-0 bg-border" />
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
      id={weekString}
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
      id={dateString}
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
  id: string
  isActive?: boolean
  isToday?: boolean
  hasNotes?: boolean
}

function CalendarItem({
  "aria-label": ariaLabel,
  name,
  shortName,
  number,
  id,
  isActive = false,
  isToday = false,
  hasNotes = false,
}: CalendarItemProps) {
  const searchParams = useSearch({ strict: false })
  return (
    <RovingFocusGroup.Item asChild active={isActive}>
      <Link
        to="/notes/$"
        params={{ _splat: id }}
        search={{
          mode: searchParams.mode ?? "read",
          query: undefined,
          view: searchParams.view === "list" ? "list" : "grid",
        }}
        aria-label={ariaLabel}
        className={cx(
          "focus-ring relative flex w-full cursor-pointer justify-center rounded p-4 leading-4 text-text-secondary @container hover:bg-bg-hover active:bg-bg-active",

          // Underline the active day
          isActive &&
            "bg-bg-secondary text-text before:pointer-events-none before:absolute before:-bottom-2 before:h-[3px] eink:before:h-[4px] before:w-full before:bg-text before:rounded-sm before:content-['']",
          // Show a dot if the date has notes
          hasNotes &&
            "after:pointer-events-none after:absolute after:bottom-1.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:content-['']",
          // hasNotes && isActive && "after:bg-text-tertiary",
          hasNotes && "after:bg-border",
        )}
      >
        <div className="flex flex-col items-center gap-1 @[3rem]:flex-row @[3rem]:gap-2 coarse:gap-2">
          <span className="@[3rem]:hidden">{shortName}</span>
          {/* Show full name when there's enough space */}
          <span className="hidden @[3rem]:inline">{name}</span>
          <span
            className={cx(
              isToday && "-mx-1 -my-[0.125rem] rounded-sm px-1 py-[0.125rem]",
              // Outline the current day
              isToday && "shadow-[inset_0_0_0_1px_currentColor]",
              // Make outline bolder if current day is active
              // isToday && isActive && "bg-text text-bg",
            )}
          >
            {number}
          </span>
        </div>
      </Link>
    </RovingFocusGroup.Item>
  )
}
