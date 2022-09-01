import { clsx } from "clsx"
import React from "react"

export type ButtonProps = {
  variant?: "default" | "primary"
} & React.ComponentPropsWithoutRef<"button">

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "cursor-default rounded px-3 py-2 font-semibold leading-[16px] disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "ring-1 ring-inset ring-border hover:bg-bg-hover",
          variant === "primary" && "bg-text text-bg focus:ring-2 focus:ring-inset focus:ring-bg",
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
  React.ComponentPropsWithoutRef<"button">
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={clsx(
        "cursor-default rounded p-2 text-text-muted hover:bg-bg-hover focus:outline-2 focus:outline-border-focus disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
