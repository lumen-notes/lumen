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
          "relative rounded-lg ring-1 ring-border-secondary after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:border after:border-transparent dark:ring-[rgba(0,0,0,0.5)]",
          elevation === 0 && "bg-bg shadow-sm",
          elevation === 1 && "bg-bg-overlay shadow-lg",
          elevation === 2 && "bg-bg-overlay shadow-xl",
          props.tabIndex === 0 &&
            "focus:outline-none focus:after:inset-[-1px] focus:after:border-2 focus:after:border-border-focus dark:focus:after:border-border-focus",
          focusVisible &&
            "after:inset-[-1px] after:border-2 after:border-border-focus dark:after:border-border-focus",
          className,
        )}
        {...props}
      />
    )
  },
)
