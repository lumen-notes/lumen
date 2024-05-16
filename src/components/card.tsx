import React from "react"
import { cx } from "../utils/cx"

export type CardProps = React.ComponentPropsWithoutRef<"div"> & {
  elevation?: 1 | 2 | 3
  focusVisible?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation = 1, focusVisible = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx(
          "relative rounded-lg ring-1 ring-border-secondary dark:ring-inset",
          elevation === 1 && "bg-bg shadow-sm dark:ring-0",
          elevation === 2 && "bg-bg-overlay shadow-lg",
          elevation === 3 && "bg-bg-overlay shadow-2xl",
          props.tabIndex === 0 && "focus:outline focus:outline-2 focus:outline-border-focus",
          focusVisible && "outline outline-2 outline-border-focus",
          className,
        )}
        {...props}
      />
    )
  },
)
