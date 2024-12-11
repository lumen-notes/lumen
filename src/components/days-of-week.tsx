import { Link } from "@tanstack/react-router"
import { addDays, eachDayOfInterval, parseISO } from "date-fns"
import { useMemo } from "react"
import { useNoteById } from "../hooks/note"
import { DAY_NAMES, toDateString } from "../utils/date"
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
  const dayName = DAY_NAMES[new Date(date).getUTCDay()]

  if (!note) {
    // Placeholder
    return (
      <Link
        to="/notes/$"
        params={{ _splat: date }}
        search={{
          mode: "write",
          query: undefined,
        }}
        className="focus-ring aspect-[5/3] rounded-lg border border-dashed border-border-secondary bg-bg-card p-3 italic text-text-secondary hover:border-border"
      >
        {dayName}
      </Link>
    )
  }

  return <NotePreviewCard id={date} />
}
