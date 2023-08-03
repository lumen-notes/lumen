import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import React from "react"
import { cx } from "../utils/cx"
import { CheckIcon16 } from "./icons"

type CheckboxProps = CheckboxPrimitive.CheckboxProps & {
  priority?: 1 | 2 | 3
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, priority = 3, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    style={{
      // @ts-expect-error
      "--hsl": `var(--hsl-priority-${priority})`,
    }}
    className={cx(
      "flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border border-[hsl(var(--hsl))] bg-[hsla(var(--hsl)_/_var(--a-bg-priority))] ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 disabled:opacity-50 data-[state=checked]:border-[hsl(var(--hsl))] data-[state=checked]:bg-[hsl(var(--hsl))] data-[state=checked]:text-bg data-[state=unchecked]:hover:bg-[hsla(var(--hsl)_/_var(--a-bg-priority-hover))] coarse:h-5 coarse:w-5",
      // Default colors
      priority === 3 &&
        "border-border bg-transparent data-[state=checked]:border-border-focus data-[state=checked]:bg-border-focus data-[state=unchecked]:hover:bg-bg-secondary",
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
