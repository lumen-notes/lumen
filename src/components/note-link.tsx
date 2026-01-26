import { Link } from "@tanstack/react-router"
import { useNoteById } from "../hooks/note"
import { getCalendarNoteBasename, isCalendarNoteId } from "../utils/config"
import { isValidWeekString } from "../utils/date"
import { DateLink } from "./date-link"
import { NoteHoverCard } from "./note-hover-card"
import { WeekLink } from "./week-link"

export type NoteLinkProps = {
  id: string
  text?: string
  className?: string
  hoverCardAlign?: "start" | "center" | "end"
  hoverCardAlignOffset?: number
}

export function NoteLink({
  id,
  text,
  className,
  hoverCardAlign = "start",
  hoverCardAlignOffset,
}: NoteLinkProps) {
  const note = useNoteById(id)

  // Check if this is a calendar note (e.g., "2025-01-26" or "journal/2025-01-26")
  if (isCalendarNoteId(id)) {
    const basename = getCalendarNoteBasename(id)
    if (isValidWeekString(basename)) {
      return <WeekLink noteId={id} text={text} className={className} />
    }
    return <DateLink noteId={id} text={text} className={className} />
  }

  return (
    <NoteHoverCard.Trigger
      render={
        <Link
          className={className}
          to="/notes/$"
          params={{ _splat: id }}
          search={{ mode: "read", query: undefined, view: "grid" }}
        />
      }
      payload={{
        note: note ?? null,
        align: hoverCardAlign,
        alignOffset: hoverCardAlignOffset,
      }}
    >
      {text || id}
    </NoteHoverCard.Trigger>
  )
}
