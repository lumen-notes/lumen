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
          "rounded px-3 py-2 font-semibold leading-[16px] disabled:pointer-events-none disabled:opacity-50",
          variant === "default" &&
            "bg-bg ring-1 ring-inset ring-border hover:bg-bg-hover",
          variant === "primary" && "bg-text text-bg",
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
        "rounded p-2 text-text-muted hover:bg-bg-hover disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
