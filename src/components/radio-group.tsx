import * as RadixRadioGroup from "@radix-ui/react-radio-group"
import { cx } from "../utils/cx"

const Root = RadixRadioGroup.Root

function Item({ className, ...props }: RadixRadioGroup.RadioGroupItemProps) {
  return (
    <RadixRadioGroup.Item
      className={cx(
        "flex size-icon shrink-0 rounded-[50%] border border-border bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-focus disabled:opacity-50 data-[state=checked]:border-border-focus data-[state=checked]:bg-border-focus data-[state=unchecked]:hover:bg-bg-secondary",
        className,
      )}
      {...props}
    >
      <RadixRadioGroup.Indicator className="relative flex h-full w-full items-center justify-center after:block after:h-[6px] after:w-[6px] after:rounded-[50%] after:bg-bg after:content-['']" />
    </RadixRadioGroup.Item>
  )
}

export const RadioGroup = Object.assign(Root, { Item })
