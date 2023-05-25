import { TooltipContentProps } from "@radix-ui/react-tooltip"
import React from "react"
import { cx } from "../utils/cx"
import { Keys } from "./keys"
import { Tooltip } from "./tooltip"

type IconButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  "aria-label": string // Required for accessibility
  shortcut?: string[]
  tooltipSide?: TooltipContentProps["side"]
  disableTooltip?: boolean
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
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
            className={cx(
              "focus-ring inline-flex cursor-default items-center justify-center rounded-sm p-2 text-text-secondary hover:bg-bg-secondary disabled:pointer-events-none disabled:opacity-50 coarse:p-3",
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
