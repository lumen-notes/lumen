import React from "react"

type TextInputProps = React.ComponentPropsWithoutRef<"input">

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className="h-8 w-full rounded-sm border border-border bg-transparent px-3 [-webkit-appearance:none] [font-variant-numeric:inherit] placeholder:text-text-secondary hover:bg-bg-secondary focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-border-focus focus-visible:bg-transparent coarse:h-10 coarse:px-4"
        type={type}
        {...props}
      />
    )
  },
)
