import React from "react"
import { useMeasure } from "react-use"

type AssistantActivityIndicatorProps = {
  state: "idle" | "thinking" | "speaking"
  children: React.ReactNode
}

export function AssistantActivityIndicator({
  children,
  state = "idle",
}: AssistantActivityIndicatorProps) {
  const [ref, bounds] = useMeasure<HTMLDivElement>()

  const perimeter = React.useMemo(() => {
    return bounds.width * 2 + bounds.height * 2
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
            className="spin-stroke coarse:hidden"
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            rx="8"
            strokeDasharray={
              state === "thinking" ? `${strokeLength} ${perimeter - strokeLength}` : "0 0"
            }
          />
          {/* Increase corner radius for coarse pointer devices */}
          <rect
            className="spin-stroke hidden coarse:block"
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            rx="10"
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
