import React from "react"
import { useMeasure } from "react-use"

export type AssistantActivityIndicatorProps = {
  state: "idle" | "thinking" | "speaking"
  children: React.ReactNode
}

const GAP = 3
const STROKE_LENGTH = 36

export function AssistantActivityIndicator({
  children,
  state = "idle",
}: AssistantActivityIndicatorProps) {
  const [ref, bounds] = useMeasure<HTMLDivElement>()

  const { radius, perimeter } = React.useMemo(() => {
    const width = bounds.width + GAP * 2
    const height = bounds.height + GAP * 2
    const radius = height / 2
    // Calculate the perimeter of the rectangle, accounting for the rounded corners
    const perimeter = (width - 2 * radius) * 2 + (height - 2 * radius) * 2 + 2 * Math.PI * radius
    return { radius, perimeter }
  }, [bounds])

  return (
    <div ref={ref} className="relative flex">
      {state !== "idle" ? (
        <svg
          className="pointer-events-none absolute -inset-[var(--gap)] z-10 h-[calc(100%+var(--gap)*2)] w-[calc(100%+var(--gap)*2)] overflow-visible text-border"
          style={{ "--perimeter": `${perimeter}px`, "--gap": `${GAP}px` } as React.CSSProperties}
        >
          <rect
            className="spin-stroke"
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            rx={radius}
            strokeDasharray={
              state === "thinking" ? `${STROKE_LENGTH} ${perimeter - STROKE_LENGTH}` : "0 0"
            }
          />
        </svg>
      ) : null}
      {children}
    </div>
  )
}
