import { Slot } from "@radix-ui/react-slot"
import { cx } from "../utils/cx"
import React from "react"
import { CloseIcon12, CloseIcon8 } from "./icons"
import { IconButton } from "./icon-button"

type PillButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  children: React.ReactNode
  asChild?: boolean
  removable?: boolean
  onRemove?: () => void
  className?: string
  variant?: "primary" | "secondary" | "dashed"
}

export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ children, asChild, className, variant = "secondary", removable, onRemove, ...props }, ref) => {
    const Component = asChild ? Slot : "button"
    return (
      <Component
        ref={ref}
        className={cx(
          "inline-flex h-6 items-center gap-[0.375rem] rounded-full border bg-clip-border px-2 focus-visible:border-solid focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-focus coarse:h-8 coarse:px-3 coarse:py-2",
          variant === "dashed" &&
            "border-dashed border-border bg-transparent text-text-secondary hover:bg-bg-secondary",
          variant === "secondary" && "border-border-secondary bg-bg-secondary hover:bg-bg-tertiary",
          variant === "primary" && "border-transparent bg-text text-bg",
          // removable && "pe-[0.09rem]",
          className,
        )}
        {...props}
      >
        {children}
        {removable && (
          <IconButton
            onClick={onRemove}
            aria-label="Remove"
            className="m-0 -mr-1 rounded-full p-0.5"
          >
            <CloseIcon12 className={cx(variant === "primary" && "bg-text text-bg")} />
          </IconButton>
        )}
      </Component>
    )
  },
)
