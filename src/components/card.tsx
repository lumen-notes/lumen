import { clsx } from "clsx"
import React from "react"

type CardProps = {
  elevation?: 0 | 1
}

export const Card = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & CardProps
>(({ className, elevation = 0, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        "rounded-lg ring-1 ring-border-divider dark:ring-inset",
        elevation === 0 && "bg-bg shadow-sm",
        elevation === 1 && "bg-bg-overlay shadow-lg",
        className,
      )}
      {...props}
    />
  )
})
