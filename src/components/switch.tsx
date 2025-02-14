import * as RadixSwitch from "@radix-ui/react-switch"
import { cx } from "../utils/cx"

export function Switch({ className, ...props }: RadixSwitch.SwitchProps) {
  return (
    <RadixSwitch.Root
      className={cx(
        "relative h-4 cursor-pointer rounded-full bg-bg-secondary pr-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-focus data-[state=checked]:bg-border-focus data-[state=unchecked]:ring-1 data-[state=unchecked]:ring-inset data-[state=unchecked]:ring-border-secondary enabled:data-[state=unchecked]:hover:bg-bg-tertiary coarse:h-5",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb className="block h-4 w-4 translate-x-0 rounded-full border border-border bg-bg-overlay transition-transform will-change-transform data-[state=checked]:translate-x-3 data-[state=checked]:border-border-focus coarse:h-5 coarse:w-5" />
    </RadixSwitch.Root>
  )
}
