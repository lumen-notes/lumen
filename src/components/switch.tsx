import * as RadixSwitch from "@radix-ui/react-switch"
import { cx } from "../utils/cx"

export function Switch({ className, ...props }: RadixSwitch.SwitchProps) {
  return (
    <RadixSwitch.Root
      className={cx(
        "relative h-4 w-7 cursor-pointer rounded-full bg-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-focus data-[state=checked]:bg-border-focus data-[state=unchecked]:hover:bg-text-tertiary coarse:h-5 coarse:w-8",
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb className="block h-3 w-3 translate-x-0.5 rounded-full bg-bg shadow-md transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[14px] coarse:h-4 coarse:w-4" />
    </RadixSwitch.Root>
  )
}
