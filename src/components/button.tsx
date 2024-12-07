import React from "react"
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
          "focus-ring inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded font-semibold leading-4 transition-[transform,background-color] duration-100 active:scale-95 disabled:pointer-events-none disabled:opacity-50",
          variant === "secondary" && "bg-bg-secondary hover:bg-bg-tertiary",
          variant === "primary" && "bg-text text-bg",
          size === "small" && "h-6 px-2 coarse:h-8 coarse:px-3",
          size === "medium" && "h-8 px-3 coarse:h-10 coarse:px-4",
          className,
        )}
        {...props}
      >
        {children}
        {shortcut ? (
          <span
            className={cx(
              "font-normal coarse:hidden",
              variant === "secondary" && "text-text-secondary",
            )}
          >
            {shortcut.join("")}
          </span>
        ) : null}
      </button>
    )
  },
)
