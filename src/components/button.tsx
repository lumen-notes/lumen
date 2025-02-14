import React from "react"
import { Keys } from "./keys"
import { cx } from "../utils/cx"

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
          "focus-ring inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded leading-4",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "coarse:h-10 coarse:px-4",
          variant === "secondary" && "bg-bg-secondary enabled:hover:bg-bg-tertiary",
          variant === "primary" && "bg-text font-bold text-bg [&_*]:text-bg",
          size === "small" && "h-6 px-2",
          size === "medium" && "h-8 px-3",
          className,
        )}
        {...props}
      >
        {children}
        {shortcut ? (
          <span className="coarse:hidden">
            <Keys keys={shortcut} />
          </span>
        ) : null}
      </button>
    )
  },
)
