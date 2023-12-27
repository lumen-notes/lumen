import * as RadixSwitch from "@radix-ui/react-switch"
import { cx } from "../utils/cx"

export function Switch({ className, ...props }: RadixSwitch.SwitchProps) {
  return (
    <RadixSwitch.Root
      className={cx(
        "relative h-4 w-7 cursor-pointer rounded-full bg-border outline-none focus-visible:outline-offset-1 focus-visible:outline-border-focus data-[state=checked]:bg-border-focus",
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb className="block h-3 w-3 translate-x-0.5 rounded-full bg-bg transition-transform will-change-transform duration-100 data-[state=checked]:translate-x-[14px]" />
    </RadixSwitch.Root>
  )
}
