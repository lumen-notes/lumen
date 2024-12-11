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
          "rounded-xl relative ring-1 ring-border-secondary dark:ring-inset",
          elevation === 1 && "bg-bg shadow-sm dark:ring-0",
          // Subtle top highlight to give the card more depth in dark mode
          // elevation === 1 &&
          //   "relative dark:2x:before:pointer-events-none dark:2x:before:absolute dark:2x:before:inset-0 dark:2x:before:z-20 dark:2x:before:rounded-xl dark:2x:before:[box-shadow:inset_0_0.5px_var(--color-border-secondary)]",
          elevation === 2 && "bg-bg-overlay shadow-lg",
          elevation === 3 && "bg-bg-overlay shadow-2xl",
          props.tabIndex === 0 &&
            "fine:focus:outline fine:focus:outline-2 fine:focus:outline-border-focus",
          focusVisible && "outline outline-2 outline-border-focus",
          className,
        )}
        {...props}
      />
    )
  },
)
