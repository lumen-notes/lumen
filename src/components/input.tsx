import React from "react"

type InputProps = React.ComponentPropsWithoutRef<"input">

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className="focus-ring w-full rounded-sm bg-bg-secondary px-3 py-2 [font-variant-numeric:inherit] placeholder:text-text-secondary focus-visible:bg-bg touch:px-4 touch:py-3"
        type={type}
        {...props}
      />
    )
  },
)
