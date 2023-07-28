import React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cx } from "../utils/cx"
import { CheckIcon16 } from "./icons"

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cx(
      "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 disabled:opacity-50 data-[state=checked]:border-border-focus data-[state=checked]:bg-border-focus data-[state=checked]:text-bg data-[state=unchecked]:hover:bg-bg-secondary coarse:h-5 coarse:w-5",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator>
      <CheckIcon16 className="text-bg coarse:h-5 coarse:w-5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))

Checkbox.displayName = CheckboxPrimitive.Root.displayName
