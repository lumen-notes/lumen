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
import { Link, useSearch, useNavigate } from "@tanstack/react-router"
import { datesAtom, notesAtom } from "../global-state"
import { useNoteById } from "../hooks/note"
import { useSearchNotes } from "../hooks/search-notes"
import { cx } from "../utils/cx"
import {
  DAY_NAMES,
  MONTH_NAMES,
  formatWeek,
  toDateString,
  toWeekString,
  isValidWeekString,
} from "../utils/date"
import { IconButton } from "./icon-button"
import { ChevronLeftIcon16, ChevronRightIcon16 } from "./icons"
import { Button } from "./button"

export function Calendar({
  activeNoteId,
  className,
}: {
  activeNoteId: string
  className?: string
}) {
  const navigate = useNavigate()
  const searchParams = useSearch({ strict: false })
  const date = parseISO(activeNoteId)

  const isWeeklyNote = isValidWeekString(activeNoteId)

  const startOfWeek = React.useMemo(() => (isMonday(date) ? date : previousMonday(date)), [date])

  const endOfWeek = React.useMemo(() => nextSunday(startOfWeek), [startOfWeek])

  const daysOfWeek = React.useMemo(
    () => eachDayOfInterval({ start: startOfWeek, end: endOfWeek }),
    [startOfWeek, endOfWeek],
  )

  const navigateByInterval = React.useCallback(
    (direction: "previous" | "next") => {
      const increment = direction === "next" ? 1 : -1

      // Navigate by week for weekly notes, by day for daily notes
      const target = isWeeklyNote
        ? toWeekString(addWeeks(date, increment))
        : toDateString(addDays(date, increment))

      navigate({
        to: "/notes/$",
        params: { _splat: target },
        search: {
          mode: searchParams.mode ?? "read",
          query: undefined,
          view: searchParams.view ?? "grid",
        },
      })
    },
    [isWeeklyNote, date, navigate, searchParams.mode, searchParams.view],
  )

  return (
    <div className={cx("border-b border-border-secondary", className)}>
      <div className="-mb-px flex flex-col gap-2 overflow-hidden pb-2">
        <div className="flex items-center justify-between">
          <span className="font-content text-lg">
            <span className="font-bold">{MONTH_NAMES[startOfWeek.getMonth()]}</span>{" "}
            <span>{startOfWeek.getFullYear()}</span>
          </span>
          <div className="flex gap-px rounded bg-bg-secondary">
            <IconButton
              aria-label={isWeeklyNote ? "Previous week" : "Previous day"}
              onClick={() => navigateByInterval("previous")}
            >
              <ChevronLeftIcon16 />
            </IconButton>
            <Button
              className="bg-transparent hover:bg-bg-hover active:bg-bg-active"
              onClick={() => {
                const today = new Date()
                navigate({
                  to: "/notes/$",
                  params: { _splat: toDateString(today) },
                  search: {
                    mode: searchParams.mode ?? "read",
                    query: undefined,
                    view: searchParams.view ?? "grid",
                  },
                })
              }}
            >
              Today
            </Button>
            <IconButton
              aria-label={isWeeklyNote ? "Next week" : "Next day"}
              onClick={() => navigateByInterval("next")}
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
            <div role="separator" className="mx-2 my-4 w-px flex-shrink-0 bg-border-secondary" />
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
          view: searchParams.view ?? "grid",
        }}
        aria-label={ariaLabel}
        className={cx(
          "focus-ring relative flex w-full cursor-pointer justify-center rounded p-4 leading-4 text-text-secondary @container hover:bg-bg-hover active:bg-bg-active",

          // Underline the active day
          isActive &&
            "font-bold text-text before:pointer-events-none before:absolute before:-bottom-2 before:h-[3px] eink:before:h-[4px] before:w-full before:bg-text before:rounded-sm before:content-['']",

          // Show a dot if the date has notes
          hasNotes &&
            "after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:content-['']",
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
              isToday && "-mx-1 -my-[0.125rem] rounded-sm px-1 py-[0.125rem]",
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
