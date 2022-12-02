import * as RovingFocusGroup from "@radix-ui/react-roving-focus"
import { useActor } from "@xstate/react"
import clsx from "clsx"
import { eachDayOfInterval, isMonday, nextMonday, nextSunday, previousMonday } from "date-fns"
import { toDate } from "date-fns-tz"
import { AnimatePresence, motion } from "framer-motion"
import React from "react"
import { IconButton } from "../components/button"
import { CalendarIcon24, ChevronLeftIcon16, ChevronRightIcon16 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps, Panels } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { NoteId } from "../types"
import { DAY_NAMES, formatDate, formatDateDistance, MONTH_NAMES, toDateString } from "../utils/date"

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function DatePanel({ id, params = {}, onClose }: PanelProps) {
  const { date = "" } = params
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  // Check if the date is valid
  const isValidDate = DATE_REGEX.test(date) && !isNaN(Date.parse(date))

  if (!isValidDate) {
    return <div>Invalid date</div>
  }

  const noteIds = state.context.dates[date] || []

  return (
    <Panel
      id={id}
      title={formatDate(date)}
      description={formatDateDistance(date)}
      icon={<CalendarIcon24 date={new Date(date).getUTCDate()} />}
      onClose={onClose}
    >
      <div className="flex flex-col">
        <Calendar activeDate={date} dates={state.context.dates} />
        <div className="p-4">
          <LinkHighlightProvider href={`/dates/${date}`}>
            <NoteList key={date} ids={noteIds} />
          </LinkHighlightProvider>
        </div>
      </div>
    </Panel>
  )
}

function Calendar({
  activeDate: dateString,
  dates,
}: {
  activeDate: string
  dates: Record<string, NoteId[]>
}) {
  const [direction, setDirection] = React.useState<"previous" | "next">("next")

  const date = toDate(dateString)

  const [startOfWeek, setStartOfWeek] = React.useState(() =>
    isMonday(date) ? date : previousMonday(date),
  )

  const endOfWeek = nextSunday(startOfWeek)

  const week = eachDayOfInterval({ start: startOfWeek, end: endOfWeek })

  return (
    <div className="flex flex-col gap-1 overflow-hidden py-2 px-4 shadow-[inset_0_-1px_0_var(--color-border-secondary)]">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold">
          {MONTH_NAMES[startOfWeek.getMonth()]} {startOfWeek.getFullYear()}
        </span>

        <RovingFocusGroup.Root orientation="horizontal">
          <RovingFocusGroup.Item asChild>
            <IconButton
              aria-label="Previous week"
              onClick={() => {
                setDirection("previous")
                setTimeout(() => setStartOfWeek(previousMonday(startOfWeek)))
              }}
            >
              <ChevronLeftIcon16 />
            </IconButton>
          </RovingFocusGroup.Item>
          <RovingFocusGroup.Item asChild>
            <IconButton
              aria-label="Next week"
              onClick={() => {
                setDirection("next")
                setTimeout(() => setStartOfWeek(nextMonday(startOfWeek)))
              }}
            >
              <ChevronRightIcon16 />
            </IconButton>
          </RovingFocusGroup.Item>
        </RovingFocusGroup.Root>
      </div>
      <div className="grid">
        <AnimatePresence initial={false}>
          <motion.div
            key={startOfWeek.toString()}
            className="col-span-full row-span-full"
            initial={{ x: direction === "next" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: direction === "next" ? "-100%" : "100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <RovingFocusGroup.Root orientation="horizontal" className="flex">
              {week.map((date) => (
                <CalendarDate
                  key={date.toISOString()}
                  date={date}
                  isActive={toDateString(date) === dateString}
                  hasNotes={dates[toDateString(date)]?.length > 0}
                />
              ))}
            </RovingFocusGroup.Root>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function CalendarDate({
  date,
  isActive = false,
  hasNotes = false,
}: {
  date: Date
  isActive?: boolean
  hasNotes?: boolean
}) {
  const dayName = DAY_NAMES[date.getDay()]
  const monthName = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const label = `${dayName}, ${monthName} ${day}, ${year}`
  const isToday = toDateString(date) === toDateString(new Date())
  return (
    <RovingFocusGroup.Item asChild active={isActive}>
      <Panels.Link
        key={date.toISOString()}
        to={`/dates/${toDateString(date)}`}
        target="_self"
        aria-label={label}
        className={clsx(
          "relative flex w-full cursor-pointer justify-center rounded p-4 leading-4 text-text-muted @container hover:bg-bg-secondary",

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
        <div className="flex flex-col items-center gap-1 @[6rem]:flex-row @[6rem]:gap-2">
          <span className="@[6rem]:hidden">{dayName.slice(0, 2)}</span>
          {/* Show the first 3 letters of the day name when there's enough space */}
          <span className="hidden @[6rem]:inline">{dayName.slice(0, 3)}</span>
          <span
            className={clsx(
              isToday && "-my-[0.125rem] -mx-1 rounded py-[0.125rem] px-1",
              // Outline the current day
              isToday && !isActive && "shadow-[inset_0_0_0_1px_currentColor]",
              // Make outline bolder if current day is active
              isToday && isActive && "bg-text text-bg",
            )}
          >
            {date.getDate()}
          </span>
        </div>
      </Panels.Link>
    </RovingFocusGroup.Item>
  )
}
