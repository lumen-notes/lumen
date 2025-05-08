import React from "react"
import { useMeasure } from "react-use"

export type AssistantActivityIndicatorProps = {
  state: "idle" | "thinking" | "speaking"
  children: React.ReactNode
}

export function AssistantActivityIndicator({
  children,
  state = "idle",
}: AssistantActivityIndicatorProps) {
  const [ref, bounds] = useMeasure<HTMLDivElement>()

  const { radius, perimeter } = React.useMemo(() => {
    const width = bounds.width + 4
    const height = bounds.height + 4
    const radius = height / 2
    // Calculate the perimeter of the rectangle, accounting for the rounded corners
    const perimeter = (width - 2 * radius) * 2 + (height - 2 * radius) * 2 + 2 * Math.PI * radius
    return { radius, perimeter }
  }, [bounds])

  const strokeLength = 36

  return (
    <div ref={ref} className="relative flex">
      {state !== "idle" ? (
        <svg
          className="pointer-events-none absolute -inset-0.5 z-10 h-[calc(100%+4px)] w-[calc(100%+4px)] overflow-visible text-border"
          style={{ "--perimeter": `${perimeter}px` } as React.CSSProperties}
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
              state === "thinking" ? `${strokeLength} ${perimeter - strokeLength}` : "0 0"
            }
          />
        </svg>
      ) : null}
      {children}
    </div>
  )
}
