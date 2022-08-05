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
          "rounded bg-bg px-3 py-2 font-semibold leading-[16px] ring-1 ring-inset ring-border disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "bg-text text-bg ring-0",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
