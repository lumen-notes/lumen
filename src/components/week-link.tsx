import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { useBacklinksForId, useNoteById } from "../hooks/note"
import { Note } from "../schema"
import { getCalendarNoteBasename } from "../utils/config"
import { cx } from "../utils/cx"
import { formatWeek } from "../utils/date"
import { NoteHoverCard } from "./note-hover-card"

export type WeekLinkProps = {
  /** Full note ID (e.g., "2025-W04" or "journal/2025-W04") */
  noteId: string
  text?: string
  className?: string
}

export function WeekLink({ noteId, text, className }: WeekLinkProps) {
  const existingNote = useNoteById(noteId)
  const backlinks = useBacklinksForId(noteId)

  // Extract the week part for formatting
  const weekBasename = getCalendarNoteBasename(noteId)

  // Create a minimal note object if no note exists
  const note: Note = useMemo(() => {
    if (existingNote) return existingNote
    return {
      id: noteId,
      content: "",
      type: "weekly",
      displayName: formatWeek(weekBasename),
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
  }, [existingNote, noteId, weekBasename, backlinks])

  const link = (
    <Link
      className={cx(!text && "text-text-secondary", className)}
      to="/notes/$"
      params={{ _splat: noteId }}
      search={{
        mode: existingNote ? "read" : "write",
        query: undefined,
        view: "grid",
      }}
    />
  )

  return (
    <NoteHoverCard.Trigger render={link} payload={{ note, align: "center" }}>
      {text || formatWeek(weekBasename)}
    </NoteHoverCard.Trigger>
  )
}
