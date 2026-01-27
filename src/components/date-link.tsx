import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { useBacklinksForId, useNoteById } from "../hooks/note"
import { Note } from "../schema"
import { getCalendarNoteBasename } from "../utils/config"
import { cx } from "../utils/cx"
import { formatDate } from "../utils/date"
import { NoteHoverCard } from "./note-hover-card"

type DateLinkProps = {
  /** Full note ID (e.g., "2025-01-26" or "journal/2025-01-26") */
  noteId: string
  text?: string
  className?: string
}

export function DateLink({ noteId, text, className }: DateLinkProps) {
  const existingNote = useNoteById(noteId)
  const backlinks = useBacklinksForId(noteId)

  // Extract the date part for formatting
  const dateBasename = getCalendarNoteBasename(noteId)

  // Create a minimal note object if no note exists
  const note: Note = useMemo(() => {
    if (existingNote) return existingNote
    return {
      id: noteId,
      content: "",
      type: "daily",
      displayName: formatDate(dateBasename),
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
  }, [existingNote, noteId, dateBasename, backlinks])

  const linkText = text || formatDate(dateBasename)

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
    <NoteHoverCard.Trigger render={link} payload={{ note, align: "start" }}>
      {linkText}
    </NoteHoverCard.Trigger>
  )
}
