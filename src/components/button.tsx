import React from "react"
import { cx } from "../utils/cx"
import { Keys } from "./keys"
import { Tooltip } from "./tooltip"

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: "secondary" | "primary"
  size?: "small" | "medium"
  shortcut?: string[]
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "medium", shortcut, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cx(
          "focus-ring inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm font-semibold leading-4 transition-all duration-100 active:scale-95 disabled:pointer-events-none disabled:opacity-50",
          variant === "secondary" && "bg-bg-secondary hover:bg-bg-tertiary",
          variant === "primary" && "bg-neutral-9 text-neutral-contrast hover:bg-neutral-10",
          size === "small" && "h-6 px-2 coarse:h-8 coarse:px-3",
          size === "medium" && "h-8 px-3 coarse:h-10 coarse:px-4",
          className,
        )}
        {...props}
      >
        {children}
        {shortcut ? (
          <span
            className={cx("font-normal coarse:hidden", variant === "secondary" && "opacity-75")}
          >
            {shortcut.join("")}
          </span>
        ) : null}
      </button>
    )
  },
)
