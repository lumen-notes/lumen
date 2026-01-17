import { Link } from "@tanstack/react-router"
import { useNoteById } from "../hooks/note"
import { isValidDateString, isValidWeekString } from "../utils/date"
import { DateLink } from "./date-link"
import { NoteHoverCard } from "./note-hover-card"
import { WeekLink } from "./week-link"

export type NoteLinkProps = {
  id: string
  text?: string
  className?: string
  previewCardAlign?: "start" | "center" | "end"
  previewCardAlignOffset?: number
}

export function NoteLink({
  id,
  text,
  className,
  previewCardAlign = "start",
  previewCardAlignOffset,
}: NoteLinkProps) {
  const note = useNoteById(id)

  if (isValidDateString(id)) {
    return <DateLink date={id} text={text} className={className} />
  }

  if (isValidWeekString(id)) {
    return <WeekLink week={id} text={text} className={className} />
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
        align: previewCardAlign,
        alignOffset: previewCardAlignOffset,
      }}
    >
      {text || id}
    </NoteHoverCard.Trigger>
  )
}
