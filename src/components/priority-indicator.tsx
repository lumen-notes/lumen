import React from "react"
import { cx } from "../utils/cx"
import { TaskListItemContext } from "./markdown"

type PriorityIndicatorProps = {
  level: 1 | 2 | 3
}

const colors: Record<1 | 2 | 3, string> = {
  1: "text-[var(--red-a12)] bg-[var(--red-a4)]",
  2: "text-[var(--orange-a12)] bg-[var(--orange-a4)]",
  3: "text-[var(--blue-a12)] bg-[var(--blue-a4)]",
}

export function PriorityIndicator({ level }: PriorityIndicatorProps) {
  const taskContext = React.useContext(TaskListItemContext)
  const isCompleted = taskContext?.completed === true

  return (
    <span
      className={cx(
        "[font-size:var(--font-size-sm)] rounded-sm px-0.5",
        isCompleted ? "text-text-secondary bg-bg-secondary" : colors[level],
      )}
    >
      !!{level}
    </span>
  )
}
