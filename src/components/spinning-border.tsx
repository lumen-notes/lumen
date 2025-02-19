import React from "react"
import { useMeasure } from "react-use"

type SpinningBorderProps = {
  children: React.ReactNode
  enabled?: boolean
}

export function SpinningBorder({ children, enabled = false }: SpinningBorderProps) {
  const [ref, bounds] = useMeasure<HTMLDivElement>()

  const perimeter = React.useMemo(() => {
    return bounds.width * 2 + bounds.height * 2
  }, [bounds])

  const strokeLength = 36

  return (
    <div ref={ref} className="relative flex">
      {enabled ? (
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
            strokeDasharray={`${strokeLength} ${perimeter - strokeLength}`}
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
            strokeDasharray={`${strokeLength} ${perimeter - strokeLength}`}
          />
        </svg>
      ) : null}
      {children}
    </div>
  )
}
