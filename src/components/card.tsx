import { clsx } from "clsx"
import React from "react"

type CardProps = {
  elevation?: 0 | 1 | 2
} & React.ComponentPropsWithoutRef<"div">

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation = 0, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-lg ring-1 ring-border-divider dark:ring-inset",
          elevation === 0 && "bg-bg shadow-sm",
          elevation === 1 && "bg-bg-overlay shadow-lg",
          elevation === 2 && "bg-bg-overlay shadow-xl",
          className,
        )}
        {...props}
      />
    )
  },
)
