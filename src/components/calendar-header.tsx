import { addDays, addWeeks, parseISO, startOfToday } from "date-fns"
import { useNavigate, useSearch } from "@tanstack/react-router"
import React from "react"
import { useBuildCalendarNoteId } from "../hooks/config"
import { getCalendarNoteBasename, isCalendarNoteId } from "../utils/config"
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
import { ChevronLeftIcon16, ChevronRightIcon16 } from "./icons"

type CalendarHeaderProps = {
  activeNoteId: string
}

export function CalendarHeader({ activeNoteId }: CalendarHeaderProps) {
  const navigate = useNavigate()
  const searchParams = useSearch({ strict: false })
  const buildId = useBuildCalendarNoteId()

  // Get the basename (date/week part) for formatting
  const basename = getCalendarNoteBasename(activeNoteId)
  const isWeekly = isValidWeekString(basename)

  const primaryText = isWeekly ? formatWeek(basename) : formatDate(basename)
  const secondaryText = isWeekly ? formatWeekDistance(basename) : formatDateDistance(basename)

  const today = startOfToday()
  const todayNoteId = buildId(toDateString(today))
  const thisWeekNoteId = buildId(toWeekString(today))

  const navigateByInterval = React.useCallback(
    (direction: "previous" | "next") => {
      const date = parseISO(basename)
      const increment = direction === "next" ? 1 : -1

      const targetBasename = isWeekly
        ? toWeekString(addWeeks(date, increment))
        : toDateString(addDays(date, increment))

      navigate({
        to: "/notes/$",
        params: { _splat: buildId(targetBasename) },
        search: {
          mode: searchParams.mode ?? "read",
          query: undefined,
          view: searchParams.view === "list" ? "list" : "grid",
        },
      })
    },
    [isWeekly, basename, navigate, searchParams.mode, searchParams.view, buildId],
  )

  const navigateToCurrentPeriod = React.useCallback(() => {
    const target = isWeekly ? thisWeekNoteId : todayNoteId
    navigate({
      to: "/notes/$",
      params: { _splat: target },
      search: {
        mode: searchParams.mode ?? "read",
        query: undefined,
        view: searchParams.view === "list" ? "list" : "grid",
      },
    })
  }, [isWeekly, thisWeekNoteId, todayNoteId, navigate, searchParams.mode, searchParams.view])

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-text text-lg leading-8 truncate coarse:leading-10">
          {primaryText}
        </span>
        <span className="text-text-secondary">{secondaryText}</span>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={navigateToCurrentPeriod}
          disabled={isWeekly ? activeNoteId === thisWeekNoteId : activeNoteId === todayNoteId}
        >
          {isWeekly ? "This week" : "Today"}
        </Button>
        <div className="flex rounded bg-bg-secondary">
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
        </div>
      </div>
    </div>
  )
}
