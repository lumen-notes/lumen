import * as HoverCard from "@radix-ui/react-hover-card"
import { Link } from "@tanstack/react-router"
import React from "react"
import { useNoteById } from "../hooks/note"
import { isValidDateString, isValidWeekString } from "../utils/date"
import { DateLink } from "./date-link"
import { NotePreview } from "./note-preview"
import { ErrorIcon16 } from "./icons"
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

  if (isValidDateString(id)) {
    return <DateLink date={id} text={text} className={className} />
  }

  if (isValidWeekString(id)) {
    return <WeekLink week={id} text={text} className={className} />
  }

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Link
          className={className}
          to="/notes/$"
          params={{ _splat: id }}
          search={{ mode: "read", query: undefined, view: "grid" }}
        >
          {text || id}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          sideOffset={4}
          align={hoverCardAlign}
          alignOffset={hoverCardAlignOffset}
          className="card-2 !rounded-[calc(var(--border-radius-base)+6px)] z-20 w-96 animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 print:hidden"
        >
          {note ? (
            <NotePreview note={note} />
          ) : (
            <span className="flex items-center gap-2 p-4 text-text-danger">
              <ErrorIcon16 />
              Note not found
            </span>
          )}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
