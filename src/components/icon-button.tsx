import { TooltipContentProps } from "@radix-ui/react-tooltip"
import React from "react"
import { cx } from "../utils/cx"
import { Keys } from "./keys"
import { Tooltip } from "./tooltip"
import { Slot } from "@radix-ui/react-slot"

export type IconButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  "aria-label": string // Required for accessibility
  size?: "small" | "medium"
  shortcut?: string[]
  tooltipSide?: TooltipContentProps["side"]
  tooltipAlign?: TooltipContentProps["align"]
  tooltipSideOffset?: TooltipContentProps["sideOffset"]
  disableTooltip?: boolean
  asChild?: boolean
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
      tooltipSideOffset,
      disableTooltip = false,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button"
    return (
      <Tooltip open={disableTooltip ? false : undefined}>
        <Tooltip.Trigger asChild>
          <Component
            ref={ref}
            type="button"
            className={cx(
              "focus-ring inline-flex select-none items-center justify-center rounded text-text-secondary enabled:hover:bg-bg-secondary enabled:active:bg-bg-tertiary data-[state=open]:bg-bg-secondary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "coarse:h-10 coarse:px-3",
              size === "small" && "h-6 px-2",
              size === "medium" && "h-8 px-2",
              // If we're not rendering a button, we need to add hover and active styles without the `enabled:` prefix
              asChild && "hover:bg-bg-secondary active:bg-bg-tertiary",
              className,
            )}
            {...props}
          >
            {children}
          </Component>
        </Tooltip.Trigger>
        <Tooltip.Content side={tooltipSide} align={tooltipAlign} sideOffset={tooltipSideOffset}>
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
