import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import React from "react"
import { cx } from "../utils/cx"
import { CheckIcon8 } from "./icons"

type CheckboxProps = CheckboxPrimitive.CheckboxProps

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cx(
      "flex size-icon shrink-0 items-center justify-center rounded-sm border border-border bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-focus disabled:opacity-50 data-[state=checked]:border-border-focus data-[state=checked]:bg-border-focus data-[state=unchecked]:hover:bg-bg-secondary",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator>
      <CheckIcon8 className="text-bg coarse:size-2.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))

Checkbox.displayName = CheckboxPrimitive.Root.displayName
