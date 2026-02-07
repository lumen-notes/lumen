import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  getISOWeek,
  nextSunday,
  parseISO,
  startOfISOWeek,
  startOfMonth,
} from "date-fns"
import { useAtom } from "jotai"
import React from "react"
import { Link, useSearch } from "@tanstack/react-router"
import { calendarLayoutAtom } from "../global-state"
import { useBacklinksForId, useNoteById } from "../hooks/note"
import { Note } from "../schema"
import { cx } from "../utils/cx"
import {
  DAY_NAMES,
  MONTH_NAMES,
  formatDate,
  formatWeek,
  toDateString,
  toWeekString,
} from "../utils/date"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { ChevronDownIcon16, ChevronUpIcon16, MoreIcon16, UndoIcon16 } from "./icons"
import { NoteHoverCard } from "./note-hover-card"

const CalendarContainerContext = React.createContext<React.RefObject<HTMLDivElement | null> | null>(
  null,
)

export function Calendar({
  activeNoteId,
  className,
}: {
  activeNoteId: string
  className?: string
}) {
  const date = parseISO(activeNoteId)
  const [layout, setLayout] = useAtom(calendarLayoutAtom)

  // Local state for the displayed date anchor (independent of activeNoteId)
  const [displayedDate, setDisplayedDate] = React.useState(() => date)

  // Sync displayed date when activeNoteId changes (adjust state during render)
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevActiveNoteId, setPrevActiveNoteId] = React.useState(activeNoteId)
  if (activeNoteId !== prevActiveNoteId) {
    setPrevActiveNoteId(activeNoteId)
    setDisplayedDate(date)
  }

  const displayedWeekStart = React.useMemo(() => startOfISOWeek(displayedDate), [displayedDate])
  const displayedMonthStart = React.useMemo(() => startOfMonth(displayedDate), [displayedDate])
  const endOfWeek = React.useMemo(() => nextSunday(displayedWeekStart), [displayedWeekStart])

  const daysOfWeek = React.useMemo(
    () => eachDayOfInterval({ start: displayedWeekStart, end: endOfWeek }),
    [displayedWeekStart, endOfWeek],
  )

  const navigateByWeek = React.useCallback((direction: "previous" | "next") => {
    const increment = direction === "next" ? 1 : -1
    setDisplayedDate((prev) => addWeeks(prev, increment))
  }, [])

  const navigateByMonth = React.useCallback((direction: "previous" | "next") => {
    const increment = direction === "next" ? 1 : -1
    setDisplayedDate((prev) => addMonths(prev, increment))
  }, [])

  // Check if displayed week differs from active note's week
  const activeWeekStart = React.useMemo(() => startOfISOWeek(date), [date])
  const activeMonthStart = React.useMemo(() => startOfMonth(date), [date])

  const canResetWeek = toWeekString(displayedWeekStart) !== toWeekString(activeWeekStart)
  const canResetMonth =
    displayedMonthStart.getMonth() !== activeMonthStart.getMonth() ||
    displayedMonthStart.getFullYear() !== activeMonthStart.getFullYear()
  const canReset = layout === "week" ? canResetWeek : canResetMonth

  const resetToActive = React.useCallback(() => {
    setDisplayedDate(date)
  }, [date])

  // Calculate weeks in displayed month for month view
  const weeksInMonth = React.useMemo(() => {
    const monthEnd = endOfMonth(displayedMonthStart)
    return eachWeekOfInterval(
      { start: displayedMonthStart, end: monthEnd },
      { weekStartsOn: 1 }, // Monday
    )
  }, [displayedMonthStart])

  // Display date for header
  const displayDate = layout === "week" ? displayedWeekStart : displayedMonthStart

  const navigate = layout === "week" ? navigateByWeek : navigateByMonth
  const periodLabel = layout === "week" ? "week" : "month"

  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <CalendarContainerContext.Provider value={containerRef}>
      <div ref={containerRef} className={cx("card-1 overflow-hidden rounded-xl!", className)}>
        <div className="flex flex-col gap-2 overflow-hidden">
          <div className="flex items-center justify-between pt-2 px-2">
            <span className="font-content px-2">
              <span className="font-bold">{MONTH_NAMES[displayDate.getMonth()]}</span>{" "}
              {displayDate.getFullYear()}
            </span>
            <div className="flex">
              {canReset ? (
                <IconButton aria-label={`Back to selected ${periodLabel}`} onClick={resetToActive}>
                  <UndoIcon16 />
                </IconButton>
              ) : null}

              <IconButton
                aria-label={`Previous ${periodLabel}`}
                onClick={() => navigate("previous")}
              >
                <ChevronUpIcon16 />
              </IconButton>
              <IconButton aria-label={`Next ${periodLabel}`} onClick={() => navigate("next")}>
                <ChevronDownIcon16 />
              </IconButton>
              <DropdownMenu>
                <DropdownMenu.Trigger
                  render={
                    <IconButton aria-label="Calendar options" disableTooltip>
                      <MoreIcon16 />
                    </IconButton>
                  }
                />
                <DropdownMenu.Content align="end" width={160}>
                  <DropdownMenu.Group>
                    <DropdownMenu.GroupLabel>Layout</DropdownMenu.GroupLabel>
                    <DropdownMenu.Item
                      onClick={() => setLayout("week")}
                      selected={layout === "week"}
                    >
                      Week
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onClick={() => setLayout("month")}
                      selected={layout === "month"}
                    >
                      Month
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu>
            </div>
          </div>
          {layout === "week" ? (
            <div className="grid pb-2 px-2">
              <div className="flex gap-1.5 items-center">
                <CalendarWeek
                  startOfWeek={displayedWeekStart}
                  isActive={toWeekString(displayedWeekStart) === activeNoteId}
                />
                <div role="separator" className="h-8 w-px shrink-0 bg-border-secondary" />
                {daysOfWeek.map((day) => (
                  <CalendarDate
                    key={day.toISOString()}
                    date={day}
                    isActive={toDateString(day) === activeNoteId}
                  />
                ))}
              </div>
            </div>
          ) : (
            <MonthGrid
              weeksInMonth={weeksInMonth}
              displayedMonth={displayedMonthStart.getMonth()}
              activeNoteId={activeNoteId}
            />
          )}
        </div>
      </div>
    </CalendarContainerContext.Provider>
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
  const existingNote = useNoteById(weekString)
  const backlinks = useBacklinksForId(weekString)
  const hasNotes = Boolean(existingNote) || backlinks.length > 0
  const anchorRef = React.useContext(CalendarContainerContext)

  // Create note object for hover card (fallback if note doesn't exist)
  const note: Note = React.useMemo(() => {
    if (existingNote) return existingNote
    return {
      id: weekString,
      content: "",
      type: "weekly",
      displayName: formatWeek(weekString),
      frontmatter: {},
      title: "",
      url: null,
      alias: null,
      pinned: false,
      updatedAt: null,
      links: [],
      dates: [],
      tags: [],
      tasks: [],
      backlinks,
    }
  }, [existingNote, weekString, backlinks])

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
      note={note}
      anchor={anchorRef?.current}
      sideOffset={8}
    />
  )
}

function CalendarDate({ date, isActive = false }: { date: Date; isActive?: boolean }) {
  const dateString = toDateString(date)
  const existingNote = useNoteById(dateString)
  const backlinks = useBacklinksForId(dateString)
  const hasNotes = Boolean(existingNote) || backlinks.length > 0
  const dayName = DAY_NAMES[date.getDay()]
  const monthName = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const label = `${dayName}, ${monthName} ${day}, ${year}`
  const isToday = dateString === toDateString(new Date())

  // Create note object for hover card (fallback if note doesn't exist)
  const note: Note = React.useMemo(() => {
    if (existingNote) return existingNote
    return {
      id: dateString,
      content: "",
      type: "daily",
      displayName: formatDate(dateString),
      frontmatter: {},
      title: "",
      url: null,
      alias: null,
      pinned: false,
      updatedAt: null,
      links: [],
      dates: [],
      tags: [],
      tasks: [],
      backlinks,
    }
  }, [existingNote, dateString, backlinks])

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
      note={note}
      sideOffset={16}
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
  note: Note
  anchor?: Element | null
  sideOffset?: number
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
  note,
  anchor,
  sideOffset = 8,
}: CalendarItemProps) {
  const searchParams = useSearch({ strict: false })

  const link = (
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
        "focus-ring relative flex w-full cursor-pointer justify-center rounded p-4 leading-4 text-text @container hover:bg-bg-hover active:bg-bg-active",
        isActive && "font-bold bg-bg-secondary text-text epaper:bg-text epaper:text-bg",
        // Show a dot if the date has notes
        hasNotes &&
          "after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:content-['']",
        hasNotes && isActive && "after:bg-text-secondary epaper:after:bg-bg",
        hasNotes && !isActive && "after:bg-border",
      )}
    />
  )

  const content = (
    <div className="flex flex-col items-center gap-1 @[3rem]:flex-row @[3rem]:gap-2 coarse:gap-2">
      <span className="@[3rem]:hidden">{shortName}</span>
      {/* Show full name when there's enough space */}
      <span className="hidden @[3rem]:inline">{name}</span>
      <span
        className={cx(
          isToday && "-mx-1 -my-[0.125rem] rounded-sm px-1 py-[0.125rem] leading-[1.2]",
          isToday && !isActive && "shadow-[inset_0_0_0_1px_var(--color-text-secondary)]",
          isToday && isActive && "bg-text text-bg epaper:bg-bg epaper:text-text",
        )}
      >
        {number}
      </span>
    </div>
  )

  // Don't show hover card for active item since we're already viewing it
  if (isActive) {
    return React.cloneElement(link, {}, content)
  }

  return (
    <NoteHoverCard.Trigger
      render={link}
      note={note}
      anchor={anchor}
      side="bottom"
      sideOffset={sideOffset}
      align="start"
      transformOrigin={anchor ? "top left" : undefined}
    >
      {content}
    </NoteHoverCard.Trigger>
  )
}

// Short day labels for month view header (Monday first)
const SHORT_DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

function MonthGrid({
  weeksInMonth,
  displayedMonth,
  activeNoteId,
}: {
  weeksInMonth: Date[]
  displayedMonth: number
  activeNoteId: string
}) {
  return (
    <div className="@container">
      <div className="grid grid-cols-8 @[448px]:grid-cols-[48px_repeat(7,1fr)]">
        {/* Day labels header */}
        <div className="col-span-8 grid grid-cols-subgrid border-b border-[var(--neutral-a3)] epaper:border-border">
          <div className="flex h-8 items-center justify-center text-text-secondary">W</div>
          {SHORT_DAY_LABELS.map((day) => (
            <div key={day} className="flex h-8 items-center justify-center text-text-secondary">
              {day}
            </div>
          ))}
        </div>
        {/* Week rows */}
        {weeksInMonth.map((weekStart, index) => (
          <MonthWeekRow
            key={weekStart.toISOString()}
            weekStart={weekStart}
            displayedMonth={displayedMonth}
            activeNoteId={activeNoteId}
            isLastRow={index === weeksInMonth.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

function MonthWeekRow({
  weekStart,
  displayedMonth,
  activeNoteId,
  isLastRow,
}: {
  weekStart: Date
  displayedMonth: number
  activeNoteId: string
  isLastRow: boolean
}) {
  // Get the Monday of this week (weekStart should already be Monday from eachWeekOfInterval)
  const mondayOfWeek = startOfISOWeek(weekStart)
  const weekString = toWeekString(mondayOfWeek)
  const weekNumber = getISOWeek(mondayOfWeek)
  const label = formatWeek(weekString)

  const existingNote = useNoteById(weekString)
  const backlinks = useBacklinksForId(weekString)
  const hasWeekNotes = Boolean(existingNote) || backlinks.length > 0

  const daysOfWeek = React.useMemo(() => {
    const endOfWeek = addDays(mondayOfWeek, 6)
    return eachDayOfInterval({ start: mondayOfWeek, end: endOfWeek })
  }, [mondayOfWeek])

  const searchParams = useSearch({ strict: false })
  const isWeekActive = weekString === activeNoteId
  const anchorRef = React.useContext(CalendarContainerContext)

  // Create note object for hover card (fallback if note doesn't exist)
  const note: Note = React.useMemo(() => {
    if (existingNote) return existingNote
    return {
      id: weekString,
      content: "",
      type: "weekly",
      displayName: formatWeek(weekString),
      frontmatter: {},
      title: "",
      url: null,
      alias: null,
      pinned: false,
      updatedAt: null,
      links: [],
      dates: [],
      tags: [],
      tasks: [],
      backlinks,
    }
  }, [existingNote, weekString, backlinks])

  const weekLink = (
    <Link
      to="/notes/$"
      params={{ _splat: weekString }}
      search={{
        mode: searchParams.mode ?? "read",
        query: undefined,
        view: searchParams.view === "list" ? "list" : "grid",
      }}
      aria-label={label}
      className={cx(
        "focus-ring relative flex h-12 items-center justify-center text-text-secondary -m-px",
        !isWeekActive && "hover:bg-[var(--neutral-a2)] active:bg-[var(--neutral-a3)]",
        isWeekActive && "font-bold bg-[var(--neutral-a3)] text-text epaper:bg-text epaper:text-bg",
        hasWeekNotes &&
          "after:pointer-events-none after:absolute after:bottom-2 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:content-['']",
        hasWeekNotes && isWeekActive && "after:bg-text-secondary epaper:after:bg-bg",
        hasWeekNotes && !isWeekActive && "after:bg-border",
      )}
    />
  )

  // Week number link - conditionally wrap in hover card if not active
  const weekNumberElement = isWeekActive ? (
    React.cloneElement(weekLink, {}, weekNumber)
  ) : (
    <NoteHoverCard.Trigger
      render={weekLink}
      note={note}
      anchor={anchorRef?.current}
      side="bottom"
      sideOffset={8}
      align="start"
      transformOrigin="top left"
    >
      {weekNumber}
    </NoteHoverCard.Trigger>
  )

  return (
    <div
      className={cx(
        "col-span-8 grid grid-cols-subgrid divide-x divide-[var(--neutral-a3)] epaper:divide-border",
        !isLastRow && "border-b border-[var(--neutral-a3)] epaper:border-border",
      )}
    >
      {/* Week number link */}
      <div>{weekNumberElement}</div>
      {/* Date cells */}
      {daysOfWeek.map((day, index) => (
        <MonthDateCell
          key={day.toISOString()}
          date={day}
          isOutsideMonth={day.getMonth() !== displayedMonth}
          isActive={toDateString(day) === activeNoteId}
        />
      ))}
    </div>
  )
}

function MonthDateCell({
  date,
  isOutsideMonth = false,
  isActive = false,
}: {
  date: Date
  isOutsideMonth?: boolean
  isActive?: boolean
}) {
  const dateString = toDateString(date)
  const existingNote = useNoteById(dateString)
  const backlinks = useBacklinksForId(dateString)
  const hasNotes = Boolean(existingNote) || backlinks.length > 0
  const dayName = DAY_NAMES[date.getDay()]
  const monthName = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const label = `${dayName}, ${monthName} ${day}, ${year}`
  const isToday = dateString === toDateString(new Date())
  const searchParams = useSearch({ strict: false })
  const anchorRef = React.useContext(CalendarContainerContext)

  // Create note object for hover card (fallback if note doesn't exist)
  const note: Note = React.useMemo(() => {
    if (existingNote) return existingNote
    return {
      id: dateString,
      content: "",
      type: "daily",
      displayName: formatDate(dateString),
      frontmatter: {},
      title: "",
      url: null,
      alias: null,
      pinned: false,
      updatedAt: null,
      links: [],
      dates: [],
      tags: [],
      tasks: [],
      backlinks,
    }
  }, [existingNote, dateString, backlinks])

  const link = (
    <Link
      to="/notes/$"
      params={{ _splat: dateString }}
      search={{
        mode: searchParams.mode ?? "read",
        query: undefined,
        view: searchParams.view === "list" ? "list" : "grid",
      }}
      aria-label={label}
      className={cx(
        "focus-ring relative flex h-12 items-center justify-center -m-px",
        isOutsideMonth && !isActive ? "text-text-tertiary" : "text-text",
        !isActive && "hover:bg-[var(--neutral-a2)] active:bg-[var(--neutral-a3)]",
        isActive && "font-bold bg-[var(--neutral-a3)] epaper:bg-text epaper:text-bg",
        hasNotes &&
          "after:pointer-events-none after:absolute after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:content-['']",
        hasNotes && isToday && "after:bottom-[6px]",
        hasNotes && !isToday && "after:bottom-2",
        hasNotes && isActive && "after:bg-text-secondary epaper:after:bg-bg",
        hasNotes && !isActive && "after:bg-border",
      )}
    />
  )

  const content = (
    <span
      className={cx(
        isToday && "-mx-1 -my-[0.125rem] rounded-sm px-1 py-[0.125rem] leading-[1.2]",
        isToday && !isActive && "shadow-[inset_0_0_0_1px_var(--color-text-secondary)]",
        isToday && isActive && "bg-text text-bg epaper:bg-bg epaper:text-text",
      )}
    >
      {day}
    </span>
  )

  // Don't show hover card for active item since we're already viewing it
  if (isActive) {
    return <div>{React.cloneElement(link, {}, content)}</div>
  }

  return (
    <div>
      <NoteHoverCard.Trigger
        render={link}
        note={note}
        anchor={anchorRef?.current}
        side="bottom"
        sideOffset={8}
        align="start"
        transformOrigin="top left"
      >
        {content}
      </NoteHoverCard.Trigger>
    </div>
  )
}
