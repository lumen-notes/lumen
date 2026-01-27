import { Link } from "@tanstack/react-router"
import { addDays, eachDayOfInterval, parseISO } from "date-fns"
import { useMemo } from "react"
import { useBuildCalendarNoteId } from "../hooks/config"
import { useNoteById } from "../hooks/note"
import { formatDate, formatDateDistance, toDateString } from "../utils/date"
import { NotePreviewCard } from "./note-preview-card"

export function DaysOfWeek({ week }: { week: string }) {
  const buildId = useBuildCalendarNoteId()
  const daysOfWeek = useMemo(() => {
    const startOfWeek = parseISO(week)
    const endOfWeek = addDays(startOfWeek, 6)
    return eachDayOfInterval({ start: startOfWeek, end: endOfWeek }).map((day) => ({
      basename: toDateString(day),
      noteId: buildId(toDateString(day)),
    }))
  }, [week, buildId])

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      {daysOfWeek.map((day) => (
        <Day key={day.noteId} basename={day.basename} noteId={day.noteId} />
      ))}
    </div>
  )
}

function Day({ basename, noteId }: { basename: string; noteId: string }) {
  const note = useNoteById(noteId)

  if (!note) {
    // Placeholder
    return (
      <Link
        to="/notes/$"
        params={{ _splat: noteId }}
        search={{
          mode: "write",
          query: undefined,
          view: "grid",
        }}
        className="focus-ring aspect-[5/3] rounded-[calc(var(--border-radius-base)+6px)] border border-dashed border-border-secondary p-4 font-content hover:border-border"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-text-secondary text-[calc(var(--font-size-xl)*0.66)] [text-box-trim:trim-start]">
            {formatDate(basename)}
          </span>
          <span className="text-text-tertiary">{formatDateDistance(basename)}</span>
        </div>
      </Link>
    )
  }

  return <NotePreviewCard id={noteId} />
}
