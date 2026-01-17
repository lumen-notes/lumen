import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { useBacklinksForId, useNoteById } from "../hooks/note"
import { Note } from "../schema"
import { cx } from "../utils/cx"
import { formatDate } from "../utils/date"
import { NoteHoverCard } from "./note-hover-card"

type DateLinkProps = {
  date: string
  text?: string
  className?: string
}

export function DateLink({ date, text, className }: DateLinkProps) {
  const existingNote = useNoteById(date)
  const backlinks = useBacklinksForId(date)

  // Create a minimal note object if no note exists
  const note: Note = useMemo(() => {
    if (existingNote) return existingNote
    return {
      id: date,
      content: "",
      type: "daily",
      displayName: formatDate(date),
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
  }, [existingNote, date, backlinks])

  const linkText = text || formatDate(date)

  const link = (
    <Link
      className={cx(!text && "text-text-secondary", className)}
      to="/notes/$"
      params={{ _splat: date }}
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
