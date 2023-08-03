import React from "react"
import { cx } from "../utils/cx"

export type CardProps = React.ComponentPropsWithoutRef<"div"> & {
  elevation?: 0 | 1 | 2
  focusVisible?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation = 0, focusVisible = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx(
          "relative rounded-md border border-transparent ring-1 ring-border-secondary after:pointer-events-none after:absolute after:inset-0 after:rounded-md dark:border-border-secondary dark:ring-[rgba(0,0,0,0.6)]",
          elevation === 0 && "bg-bg shadow-sm",
          elevation === 1 && "bg-bg-overlay shadow-lg",
          elevation === 2 && "bg-bg-overlay shadow-xl",
          props.tabIndex === 0 &&
            "focus:outline-none focus:after:ring-2 focus:after:ring-border-focus",
          focusVisible && "after:ring-2 after:ring-border-focus",
          className,
        )}
        {...props}
      />
    )
  },
)
