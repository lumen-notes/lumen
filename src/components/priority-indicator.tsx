import { cx } from "../utils/cx"

const colors: Record<1 | 2 | 3, string> = {
  1: "text-[var(--red-a12)] bg-[var(--red-a4)]",
  2: "text-[var(--orange-a12)] bg-[var(--orange-a4)]",
  3: "text-[var(--blue-a12)] bg-[var(--blue-a4)]",
}

type PriorityIndicatorProps = {
  level: 1 | 2 | 3
}

export function PriorityIndicator({ level }: PriorityIndicatorProps) {
  return (
    <span
      className={cx(
        "rounded-sm px-0.5 leading-4 eink:text-text eink:bg-transparent",
        colors[level],
      )}
    >
      !!{level}
    </span>
  )
}
