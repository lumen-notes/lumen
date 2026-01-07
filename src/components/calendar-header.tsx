import { addDays, addWeeks, parseISO, startOfToday } from "date-fns"
import { useNavigate, useSearch } from "@tanstack/react-router"
import React from "react"
import {
  formatDate,
  formatDateDistance,
  formatWeek,
  formatWeekDistance,
  isValidWeekString,
  toDateString,
  toWeekString,
} from "../utils/date"
import { Button } from "./button"
import { IconButton } from "./icon-button"
import {
  ChevronLeftIcon16,
  ChevronRightIcon16,
  SidebarCollapsedIcon16,
  SidebarIcon16,
} from "./icons"

type CalendarHeaderProps = {
  noteId: string
  onToggleCalendar?: () => void
  calendarOpen?: boolean
}

export function CalendarHeader({ noteId, onToggleCalendar, calendarOpen }: CalendarHeaderProps) {
  const navigate = useNavigate()
  const searchParams = useSearch({ strict: false })
  const isWeekly = isValidWeekString(noteId)

  const primaryText = isWeekly ? formatWeek(noteId) : formatDate(noteId)
  const secondaryText = isWeekly ? formatWeekDistance(noteId) : formatDateDistance(noteId)

  const today = startOfToday()
  const todayString = toDateString(today)
  const thisWeekString = toWeekString(today)

  const navigateByInterval = React.useCallback(
    (direction: "previous" | "next") => {
      const date = parseISO(noteId)
      const increment = direction === "next" ? 1 : -1

      const target = isWeekly
        ? toWeekString(addWeeks(date, increment))
        : toDateString(addDays(date, increment))

      navigate({
        to: "/notes/$",
        params: { _splat: target },
        search: {
          mode: searchParams.mode ?? "read",
          query: undefined,
          view: searchParams.view === "list" ? "list" : "grid",
          calendar: searchParams.calendar ?? undefined,
        },
      })
    },
    [isWeekly, noteId, navigate, searchParams.mode, searchParams.view, searchParams.calendar],
  )

  const navigateToCurrentPeriod = React.useCallback(() => {
    const target = isWeekly ? thisWeekString : todayString
    navigate({
      to: "/notes/$",
      params: { _splat: target },
      search: {
        mode: searchParams.mode ?? "read",
        query: undefined,
        view: searchParams.view === "list" ? "list" : "grid",
        calendar: searchParams.calendar ?? undefined,
      },
    })
  }, [
    isWeekly,
    thisWeekString,
    todayString,
    navigate,
    searchParams.mode,
    searchParams.view,
    searchParams.calendar,
  ])

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-bold text-text text-xl leading-8 tracking-[-0.01em]">
          {primaryText}
        </span>
        <span className="text-lg text-text-secondary">{secondaryText}</span>
      </div>
      <div className="flex gap-2">
        <Button onClick={navigateToCurrentPeriod}>{isWeekly ? "This week" : "Today"}</Button>
        <div className="flex">
          <IconButton
            aria-label={isWeekly ? "Previous week" : "Previous day"}
            onClick={() => navigateByInterval("previous")}
          >
            <ChevronLeftIcon16 />
          </IconButton>
          <IconButton
            aria-label={isWeekly ? "Next week" : "Next day"}
            onClick={() => navigateByInterval("next")}
          >
            <ChevronRightIcon16 />
          </IconButton>
          <IconButton
            aria-label={calendarOpen ? "Hide calendar" : "Show calendar"}
            onClick={onToggleCalendar}
          >
            {calendarOpen ? (
              <SidebarIcon16 className="-scale-x-100" />
            ) : (
              <SidebarCollapsedIcon16 className="-scale-x-100" />
            )}
          </IconButton>
        </div>
      </div>
    </div>
  )
}
