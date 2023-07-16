import React from "react"
import { cx } from "../utils/cx"
import { Keys } from "./keys"
import { Tooltip } from "./tooltip"

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: "secondary" | "primary"
  shortcut?: string[]
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", shortcut, className, children, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        type="button"
        className={cx(
          "focus-ring inline-flex h-8 items-center justify-center rounded-sm px-3 font-semibold leading-4 disabled:pointer-events-none disabled:opacity-50 coarse:h-10 coarse:px-4",
          variant === "secondary" && "ring-1 ring-inset ring-border hover:bg-bg-secondary",
          variant === "primary" && "bg-text text-bg",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )

    if (shortcut) {
      return (
        <Tooltip>
          <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
          <Tooltip.Content side="bottom" className="coarse:hidden">
            <Keys keys={shortcut} />
          </Tooltip.Content>
        </Tooltip>
      )
    }

    return button
  },
)
