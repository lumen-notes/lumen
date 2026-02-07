import { Note } from "../schema"
import { HoverCard } from "./hover-card"
import { NotePreview } from "./note-preview"

export type NoteHoverCardProps = {
  render: React.ReactElement
  note: Note | null
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
  anchor?: Element | null
  transformOrigin?: string
}

export function NoteHoverCard({
  render,
  note,
  children,
  side,
  sideOffset,
  align,
  alignOffset,
  anchor,
  transformOrigin,
}: NoteHoverCardProps) {
  return (
    <HoverCard.Trigger
      render={render}
      payload={{
        content: note ? (
          <NotePreview note={note} />
        ) : (
          <div className="p-4 text-text-secondary">Note not found</div>
        ),
        popupClassName: "w-96 rounded-[calc(var(--border-radius-base)+6px)]!",
        side,
        sideOffset,
        align,
        alignOffset,
        anchor,
        transformOrigin,
      }}
    >
      {children}
    </HoverCard.Trigger>
  )
}
