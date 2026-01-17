import React from "react"

type ProgressRingProps = {
  /** Size of the component in pixels */
  size: number
  /** Value between 0 and 1 */
  value: number
  /** Stroke width in pixels */
  strokeWidth: number
}

export const ProgressRing = React.forwardRef<SVGSVGElement, ProgressRingProps>(
  ({ size, value, strokeWidth }, ref) => {
    // Calculate radius so stroke fits within bounds
    const radius = (size - strokeWidth) / 2
    const center = size / 2
    const circumference = 2 * Math.PI * radius
    // Clamp value between 0 and 1
    const clampedValue = Math.min(1, Math.max(0, value))
    const strokeDashoffset = circumference * (1 - clampedValue)

    return (
      <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-border-secondary)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-border-focus)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
    )
  },
)

ProgressRing.displayName = "ProgressRing"
