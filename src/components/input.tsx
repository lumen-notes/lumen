import React from "react"

type InputProps = React.ComponentPropsWithoutRef<"input">

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className="focus-ring h-8 w-full rounded-sm bg-bg-secondary px-3 [-webkit-appearance:none] [font-variant-numeric:inherit] placeholder:text-text-secondary focus-visible:bg-bg coarse:h-10 coarse:px-4"
        type={type}
        {...props}
      />
    )
  },
)
