import * as HoverCard from "@radix-ui/react-hover-card"
import { Link } from "@tanstack/react-router"
import { useNoteById } from "../hooks/note"
import { formatDate, formatDateDistance } from "../utils/date"
import { NotePreview } from "./note-preview"

type DateLinkProps = {
  date: string
  text?: string
  className?: string
}

export function DateLink({ date, text, className }: DateLinkProps) {
  const note = useNoteById(date)

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Link
          className={className}
          to="/notes/$"
          params={{ _splat: date }}
          search={{
            mode: note ? "read" : "write",
            query: undefined,
            view: "grid",
          }}
        >
          {text || formatDate(date)}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          sideOffset={4}
          align={note ? "start" : "center"}
          className="card-2 z-20 animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2"
        >
          {note ? (
            <div className="w-96">
              <NotePreview note={note} />
            </div>
          ) : (
            <div className="p-2 leading-none text-text-secondary">{formatDateDistance(date)}</div>
          )}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
