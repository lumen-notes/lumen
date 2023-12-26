import React from "react"

type InputProps = React.ComponentPropsWithoutRef<"input">

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className="h-8 w-full rounded-sm border border-border bg-transparent px-3 [-webkit-appearance:none] [font-variant-numeric:inherit] placeholder:text-text-secondary focus:outline-border-focus coarse:h-10 coarse:px-4"
        type={type}
        {...props}
      />
    )
  },
)
