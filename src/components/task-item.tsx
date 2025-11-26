import React from "react"
import { Link } from "@tanstack/react-router"
import { Checkbox } from "./checkbox"
import { Markdown } from "./markdown"
import { useNoteById } from "../hooks/note"
import type { NoteId, Task } from "../schema"
import { formatDateDistance } from "../utils/date"
import { cx } from "../utils/cx"
import { NoteLink } from "./note-link"

type TaskItemProps = {
  task: Task
  parentId: NoteId
  hideDate?: boolean
  className?: string
  onCompletedChange: (completed: boolean) => void
}

export function TaskItem({
  task,
  parentId,
  hideDate = false,
  className,
  onCompletedChange,
}: TaskItemProps) {
  const parentNote = useNoteById(parentId)
  const parentLabel = parentNote?.displayName ?? parentId

  return (
    <div
      className={cx("flex px-3 hover:bg-bg-hover rounded-lg py-1.5 gap-3 cursor-text", className)}
    >
      <div className="h-7 flex items-center">
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onCompletedChange?.(checked === true)}
        />
      </div>
      <Markdown>{task.displayText || task.text}</Markdown>
      {!hideDate && task.date ? (
        <Link
          to="/notes/$"
          params={{ _splat: task.date }}
          search={{ mode: "read", query: undefined, view: "grid" }}
          className="text-text-secondary whitespace-nowrap leading-7 italic hover:underline hover:underline-offset-[3px]"
        >
          {formatDateDistance(task.date)}
        </Link>
      ) : null}
      <NoteLink
        id={parentId}
        text={parentLabel}
        className="leading-7 text-text-secondary ml-auto link whitespace-nowrap"
      />
    </div>
  )
}
