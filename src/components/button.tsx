import { TooltipContentProps } from "@radix-ui/react-tooltip"
import { clsx } from "clsx"
import React from "react"
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
        className={clsx(
          "cursor-default rounded-sm px-3 py-2 font-semibold leading-4 disabled:pointer-events-none disabled:opacity-50 touch:py-3 touch:px-4",
          variant === "secondary" && "ring-1 ring-inset ring-border hover:bg-bg-secondary",
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
    disableTooltip?: boolean
  }
>(
  (
    { className, children, shortcut, tooltipSide = "bottom", disableTooltip = false, ...props },
    ref,
  ) => {
    return (
      <Tooltip open={disableTooltip ? false : undefined}>
        <Tooltip.Trigger asChild>
          <button
            ref={ref}
            type="button"
            className={clsx(
              "inline-flex cursor-default justify-center rounded-sm p-2 text-text-secondary hover:bg-bg-secondary disabled:pointer-events-none disabled:opacity-50 touch:p-3",
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
  },
)
