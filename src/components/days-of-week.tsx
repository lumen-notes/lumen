import { addDays, eachDayOfInterval, parseISO } from "date-fns"
import { useMemo } from "react"
import { useNoteById } from "../hooks/note"
import { toDateString, DAY_NAMES } from "../utils/date"
import { NotePreviewCard } from "./note-preview-card"
import { useSearch, Link } from "@tanstack/react-router"

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
  const searchParams = useSearch({ strict: false })
  const dayName = DAY_NAMES[new Date(date).getUTCDay()]

  if (!note) {
    return (
      <Link
        to="/notes/$"
        params={{ _splat: date }}
        search={{ mode: "write", width: searchParams.width === "fill" ? "fill" : "fixed" }}
        className="focus-ring aspect-[5/3] rounded-lg border border-dashed border-border-secondary bg-bg-card p-3 italic text-text-secondary transition-[border-color] duration-100 hover:border-border hover:bg-bg-secondary active:bg-bg-tertiary"
      >
        {dayName}
      </Link>
    )
  }

  return <NotePreviewCard id={date} />
}
