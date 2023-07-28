import { Slot } from "@radix-ui/react-slot"
import { cx } from "../utils/cx"
import React from "react"

type PillButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  children: React.ReactNode
  asChild?: boolean
  className?: string
  variant?: "fill" | "outline"
}

export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ children, asChild, className, variant = "fill", ...props }, ref) => {
    const Component = asChild ? Slot : "button"
    return (
      <Component
        ref={ref}
        className={cx(
          "focus-ring inline-flex gap-[0.375rem] rounded-full px-[0.625rem] py-1 leading-4 ring-1 ring-inset ring-border-secondary  coarse:px-3 coarse:py-2",
          variant === "outline"
            ? "bg-transparent text-text-secondary hover:bg-bg-secondary"
            : "bg-bg-secondary hover:bg-bg-tertiary",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    )
  },
)
