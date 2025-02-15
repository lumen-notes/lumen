import React from "react"
import { cx } from "../utils/cx"

type TextInputProps = React.ComponentPropsWithoutRef<"input">

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ type = "text", className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cx(
          "h-8 w-full rounded border border-border bg-transparent px-3 [-webkit-appearance:none] [font-variant-numeric:inherit] placeholder:text-text-secondary focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-border-focus focus-visible:bg-transparent coarse:h-10 coarse:px-4",
          className,
        )}
        type={type}
        {...props}
      />
    )
  },
)
