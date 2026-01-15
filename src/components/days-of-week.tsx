import { Link } from "@tanstack/react-router"
import { addDays, eachDayOfInterval, parseISO } from "date-fns"
import { useMemo } from "react"
import { useNoteById } from "../hooks/note"
import { formatDate, formatDateDistance, toDateString } from "../utils/date"
import { NotePreviewCard } from "./note-preview-card"

export function DaysOfWeek({ week }: { week: string }) {
  const daysOfWeek = useMemo(() => {
    const startOfWeek = parseISO(week)
    const endOfWeek = addDays(startOfWeek, 6)
    return eachDayOfInterval({ start: startOfWeek, end: endOfWeek }).map(toDateString)
  }, [week])

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      {daysOfWeek.map((day) => (
        <Day key={day} date={day} />
      ))}
    </div>
  )
}

function Day({ date }: { date: string }) {
  const note = useNoteById(date)

  if (!note) {
    // Placeholder
    return (
      <Link
        to="/notes/$"
        params={{ _splat: date }}
        search={{
          mode: "write",
          query: undefined,
          view: "grid",
        }}
        className="focus-ring aspect-[5/3] rounded-[calc(var(--border-radius-base)+6px)] border border-dashed border-border-secondary xbg-bg-card p-4 font-content hover:border-border"
      >
        <div className="flex flex-col gap-0.5 text-text-secondary">
          <span className="text-[calc(var(--font-size-xl)*0.66)] [text-box-trim:trim-start]">
            {formatDate(date)}
          </span>
          <span>{formatDateDistance(date)}</span>
        </div>
      </Link>
    )
  }

  return <NotePreviewCard id={date} />
}
