import { TooltipContentProps } from "@radix-ui/react-tooltip"
import React from "react"
import { cx } from "../utils/cx"
import { Keys } from "./keys"
import { Tooltip } from "./tooltip"

export type IconButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  "aria-label": string // Required for accessibility
  size?: "small" | "medium"
  shortcut?: string[]
  tooltipSide?: TooltipContentProps["side"]
  tooltipAlign?: TooltipContentProps["align"]
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
      tooltipAlign = "center",
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
              "focus-ring inline-flex items-center justify-center rounded text-text-secondary hover:bg-bg-secondary active:bg-bg-tertiary disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-bg-secondary",
              "coarse:h-10 coarse:w-10",
              size === "small" && "h-6 w-8",
              size === "medium" && "h-8 w-8",
              className,
            )}
            {...props}
          >
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content side={tooltipSide} align={tooltipAlign}>
          <div className="flex items-center gap-1.5">
            <span>{props["aria-label"]}</span>
            {shortcut ? (
              <div className="flex text-text-secondary coarse:hidden">
                <Keys keys={shortcut} />
              </div>
            ) : null}
          </div>
        </Tooltip.Content>
      </Tooltip>
    )
  },
)
