import { Slot } from "@radix-ui/react-slot"
import React from "react"
import { cx } from "../utils/cx"

type PillButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  children: React.ReactNode
  asChild?: boolean
  className?: string
  variant?: "primary" | "secondary" | "dashed"
}

export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ children, asChild, className, variant = "secondary", ...props }, ref) => {
    const Component = asChild ? Slot : "button"
    return (
      <Component
        ref={ref}
        className={cx(
          "inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-full border bg-clip-border px-2 font-sans focus-visible:border-solid focus-visible:border-border-focus focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-focus",
          "coarse:h-8 coarse:px-3 coarse:gap-2",
          variant === "dashed" &&
            "border-dashed border-border bg-transparent text-text-secondary hover:bg-bg-hover active:bg-bg-active",
          variant === "secondary" &&
            "border-transparent bg-bg-secondary hover:bg-bg-secondary-hover active:bg-bg-secondary-active eink:border-border",
          variant === "primary" && "border-transparent bg-text text-bg",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    )
  },
)
