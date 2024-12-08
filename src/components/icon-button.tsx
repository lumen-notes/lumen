import { TooltipContentProps } from "@radix-ui/react-tooltip"
import React from "react"
import { cx } from "../utils/cx"
import { Keys } from "./keys"
import { Tooltip } from "./tooltip"

type IconButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  "aria-label": string // Required for accessibility
  size?: "small" | "medium"
  shortcut?: string[]
  tooltipSide?: TooltipContentProps["side"]
  disableTooltip?: boolean
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      children,
      shortcut,
      size = "medium",
      tooltipSide = "bottom",
      disableTooltip = false,
      ...props
    },
    ref,
  ) => {
    return (
      <Tooltip open={disableTooltip ? false : undefined}>
        <Tooltip.Trigger asChild>
          <button
            ref={ref}
            type="button"
            className={cx(
              "focus-ring inline-flex items-center justify-center rounded-sm text-text-secondary transition-all duration-100 hover:bg-bg-secondary active:scale-95 disabled:pointer-events-none disabled:opacity-50",
              size === "small" && "px-2 py-1 coarse:py-2",
              size === "medium" && "p-2 coarse:p-3",
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
            {shortcut ? (
              <div className="flex coarse:hidden">
                <Keys keys={shortcut} />
              </div>
            ) : null}
          </div>
        </Tooltip.Content>
      </Tooltip>
    )
  },
)
