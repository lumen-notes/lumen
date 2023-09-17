import * as RovingFocusGroup from "@radix-ui/react-roving-focus"
import { eachDayOfInterval, isMonday, nextMonday, nextSunday, previousMonday } from "date-fns"
import { toDate } from "date-fns-tz"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { useLocation } from "react-router-dom"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import {
  CalendarIcon16,
  ChevronLeftIcon16,
  ChevronRightIcon16,
  ExternalLinkIcon16,
} from "../components/icons"
import { useLink } from "../components/link-context"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelContext, PanelProps } from "../components/panels"
import { datesAtom } from "../global-atoms"
import { cx } from "../utils/cx"
import { DAY_NAMES, MONTH_NAMES, formatDate, formatDateDistance, toDateString } from "../utils/date"
import { openNewWindow } from "../utils/open-new-window"

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function CalendarPanel({ id, onClose }: PanelProps) {
  const location = useLocation()
  const panel = React.useContext(PanelContext)
  const date = new URLSearchParams(panel ? panel.search : location.search).get("date") || ""

  // Check if the date is valid
  const isValidDate = DATE_REGEX.test(date) && !isNaN(Date.parse(date))

  if (!isValidDate) {
    return (
      <Panel id={id} title={date} icon={<CalendarIcon16 />} onClose={onClose}>
        Invalid date
      </Panel>
    )
  }

  return (
    <Panel
      id={id}
      title={formatDate(date)}
      description={formatDateDistance(date)}
      icon={<CalendarIcon16 date={new Date(date).getUTCDate()} />}
      onClose={onClose}
      actions={
        <>
          <DropdownMenu.Item
            icon={<ExternalLinkIcon16 />}
            onSelect={() => {
              const url = panel
                ? `${panel.pathname}?${panel.search}`
                : `${location.pathname}${location.search}`
              openNewWindow(url)
            }}
          >
            Open in new window
          </DropdownMenu.Item>
        </>
      }
    >
      <div className="flex flex-col">
        <Calendar key={date} activeDate={date} />
        <div className="p-4">
          <LinkHighlightProvider href={`/calendar?date=${date}`}>
            <NoteList key={date} baseQuery={`date:${date}`} />
          </LinkHighlightProvider>
        </div>
      </div>
    </Panel>
  )
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
  const Link = useLink()

  const hasNotesAtom = React.useMemo(
    () => selectAtom(datesAtom, (dates) => dates[toDateString(date)]?.length > 0),
    [date],
  )
  const hasNotes = useAtomValue(hasNotesAtom)

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
        to={`/calendar?date=${toDateString(date)}`}
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
