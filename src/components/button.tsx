import { TooltipContentProps } from "@radix-ui/react-tooltip"
import { clsx } from "clsx"
import React from "react"
import { Keys } from "./keys"
import { Tooltip } from "./tooltip"

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: "default" | "primary"
  shortcut?: string[]
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", shortcut, className, children, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        type="button"
        className={clsx(
          "cursor-default rounded px-3 py-2 font-semibold leading-4 disabled:pointer-events-none disabled:opacity-50",
          variant === "default" &&
            "bg-bg-secondary ring-1 ring-inset ring-border hover:bg-bg-tertiary",
          variant === "primary" &&
            "bg-text text-bg focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bg",
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
          <Tooltip.Content side="bottom">
            <Keys keys={shortcut} />
          </Tooltip.Content>
        </Tooltip>
      )
    }

    return button
  },
)

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & {
    "aria-label": string // Required for accessibility
    shortcut?: string[]
    tooltipSide?: TooltipContentProps["side"]
  }
>(({ className, children, shortcut, tooltipSide = "bottom", ...props }, ref) => {
  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <button
          ref={ref}
          type="button"
          className={clsx(
            "cursor-default rounded p-2 text-text-muted hover:bg-bg-secondary disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content side={tooltipSide}>
        <div className="flex items-center gap-3">
          <span>{props["aria-label"]}</span>
          {shortcut ? <Keys keys={shortcut} /> : null}
        </div>
      </Tooltip.Content>
    </Tooltip>
  )
})
