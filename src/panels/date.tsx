import * as RovingFocusGroup from "@radix-ui/react-roving-focus"
import { useActor } from "@xstate/react"
import clsx from "clsx"
import { eachDayOfInterval, isMonday, nextMonday, nextSunday, previousMonday } from "date-fns"
import { toDate } from "date-fns-tz"
import React from "react"
import { IconButton } from "../components/button"
import { Card } from "../components/card"
import { CalendarIcon24, ChevronLeftIcon16, ChevronRightIcon16 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps, Panels } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { dayNames, formatDate, formatDateDistance, monthNames, toDateString } from "../utils/date"

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
      <div className="flex flex-col gap-4">
        <Calendar activeDate={date} />
        <LinkHighlightProvider href={`/dates/${date}`}>
          <div key={date} className="flex flex-col gap-4">
            <NoteForm defaultBody={`[[${date}]]`} />
            <NoteList key={date} ids={noteIds} />
          </div>
        </LinkHighlightProvider>
      </div>
    </Panel>
  )
}

// TODO: Implement roving focus
function Calendar({ activeDate: dateString }: { activeDate: string }) {
  const date = toDate(dateString)

  const [startOfWeek, setStartOfWeek] = React.useState(() =>
    isMonday(date) ? date : previousMonday(date),
  )

  const endOfWeek = nextSunday(startOfWeek)

  const week = eachDayOfInterval({ start: startOfWeek, end: endOfWeek })

  return (
    <Card className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between">
        <span className="px-2 text-base font-semibold">
          {monthNames[startOfWeek.getMonth()]} {startOfWeek.getFullYear()}
        </span>
        <div>
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
      <RovingFocusGroup.Root orientation="horizontal" className="flex">
        {week.map((date) => (
          <CalendarDate
            key={date.toISOString()}
            date={date}
            active={toDateString(date) === dateString}
          />
        ))}
      </RovingFocusGroup.Root>
    </Card>
  )
}

function CalendarDate({ date, active: isActive = false }: { date: Date; active?: boolean }) {
  const dayName = dayNames[date.getDay()]
  const monthName = monthNames[date.getMonth()]
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
          "relative flex w-full cursor-pointer flex-col items-center gap-1 rounded py-2 leading-4 text-text-muted hover:bg-bg-hover",
          // Underline the active day
          isActive &&
            "font-semibold text-text before:absolute before:-bottom-2 before:h-[0.125rem] before:w-full before:bg-text before:content-['']",
        )}
      >
        <span>{dayName.slice(0, 2)}</span>
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
      </Panels.Link>
    </RovingFocusGroup.Item>
  )
}
