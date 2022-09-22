import { clsx } from "clsx"
import React from "react"
import { Tooltip } from "./tooltip"

export type ButtonProps = {
  variant?: "default" | "primary"
} & React.ComponentPropsWithoutRef<"button">

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={clsx(
          "cursor-default rounded px-3 py-2 font-semibold leading-[16px] disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "ring-1 ring-inset ring-border hover:bg-bg-hover",
          variant === "primary" &&
            "bg-text text-bg focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bg",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & {
    // aria-label is required for accessibility
    "aria-label": string
  }
>(({ className, children, ...props }, ref) => {
  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <button
          ref={ref}
          type="button"
          className={clsx(
            "cursor-default rounded p-2 text-text-muted hover:bg-bg-hover disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content>{props["aria-label"]}</Tooltip.Content>
    </Tooltip>
  )
})
