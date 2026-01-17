import React from "react"
import { cx } from "../utils/cx"
import { Keys } from "./keys"
import { Tooltip } from "./tooltip"
import { Slot } from "@radix-ui/react-slot"

export type IconButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  "aria-label": string // Required for accessibility
  size?: "small" | "medium"
  shortcut?: string[]
  tooltipSide?: "top" | "bottom" | "left" | "right"
  tooltipAlign?: "start" | "center" | "end"
  tooltipSideOffset?: number
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
    const trigger = (
      <Component
        ref={ref}
        type="button"
        className={cx(
          "focus-ring inline-flex cursor-pointer select-none items-center justify-center rounded text-text-secondary enabled:hover:bg-bg-hover enabled:active:bg-bg-active data-[popup-open]:bg-bg-hover",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "coarse:h-10 coarse:px-3",
          size === "small" && "h-6 px-2",
          size === "medium" && "h-8 px-2",
          // If we're not rendering a button, we need to add hover and active styles without the `enabled:` prefix
          asChild && "hover:bg-bg-hover active:bg-bg-active",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    )

    return (
      <Tooltip open={disableTooltip ? false : undefined}>
        <Tooltip.Trigger render={trigger} />
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
