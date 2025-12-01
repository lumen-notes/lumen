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
    <span className={`[font-size:var(--font-size-sm)] rounded-sm px-0.5 ${colors[level]}`}>
      !!{level}
    </span>
  )
}
