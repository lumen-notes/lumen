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
          "relative rounded-lg ring-1 ring-border-secondary after:pointer-events-none after:absolute after:inset-0 after:rounded-lg focus:outline-0  dark:ring-0 dark:after:ring-1 dark:after:ring-inset dark:after:ring-border-secondary",
          elevation === 0 && "bg-bg shadow-sm",
          elevation === 1 && "bg-bg-overlay shadow-lg",
          elevation === 2 && "bg-bg-overlay shadow-xl",
          props.tabIndex === 0 &&
            "focus:after:outline focus:after:outline-2 focus:after:-outline-offset-1 focus:after:outline-border-focus",
          focusVisible &&
            "after:outline after:outline-2 after:-outline-offset-1 after:outline-border-focus",
          className,
        )}
        {...props}
      />
    )
  },
)
