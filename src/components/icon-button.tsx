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
              "focus-ring inline-flex select-none items-center justify-center rounded text-text-secondary enabled:hover:bg-bg-secondary enabled:active:bg-bg-tertiary data-[state=open]:bg-bg-secondary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "coarse:h-10 coarse:px-3",
              size === "small" && "h-6 px-2",
              size === "medium" && "h-8 px-2",
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
