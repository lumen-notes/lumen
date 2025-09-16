import * as RadixRadioGroup from "@radix-ui/react-radio-group"
import { cx } from "../utils/cx"

const Root = RadixRadioGroup.Root

function Item({ className, ...props }: RadixRadioGroup.RadioGroupItemProps) {
  return (
    <RadixRadioGroup.Item
      className={cx(
        "flex size-4 coarse:size-5 shrink-0 rounded-full border border-border bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-focus disabled:opacity-50 data-[state=checked]:border-border-focus data-[state=checked]:bg-border-focus data-[state=unchecked]:hover:bg-bg-hover",
        className,
      )}
      {...props}
    >
      <RadixRadioGroup.Indicator className="relative flex h-full w-full items-center justify-center after:block after:size-1.5 coarse:after:size-2 after:rounded-full after:bg-bg-overlay after:content-['']" />
    </RadixRadioGroup.Item>
  )
}

export const RadioGroup = Object.assign(Root, { Item })
