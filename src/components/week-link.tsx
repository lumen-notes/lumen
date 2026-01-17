import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { useBacklinksForId, useNoteById } from "../hooks/note"
import { Note } from "../schema"
import { cx } from "../utils/cx"
import { formatWeek } from "../utils/date"
import { NoteHoverCard } from "./note-hover-card"

export type WeekLinkProps = {
  week: string
  text?: string
  className?: string
}

export function WeekLink({ week, text, className }: WeekLinkProps) {
  const existingNote = useNoteById(week)
  const backlinks = useBacklinksForId(week)

  // Create a minimal note object if no note exists
  const note: Note = useMemo(() => {
    if (existingNote) return existingNote
    return {
      id: week,
      content: "",
      type: "weekly",
      displayName: formatWeek(week),
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
  }, [existingNote, week, backlinks])

  const link = (
    <Link
      className={cx(!text && "text-text-secondary", className)}
      to="/notes/$"
      params={{ _splat: week }}
      search={{
        mode: existingNote ? "read" : "write",
        query: undefined,
        view: "grid",
      }}
    />
  )

  return (
    <NoteHoverCard.Trigger render={link} payload={{ note, align: "center" }}>
      {text || formatWeek(week)}
    </NoteHoverCard.Trigger>
  )
}
