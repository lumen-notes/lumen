import * as RadixTooltip from "@radix-ui/react-tooltip"
import React from "react"
import { cx } from "../utils/cx"

const Root = RadixTooltip.Root

const Trigger = RadixTooltip.Trigger

type ContentProps = Pick<
  RadixTooltip.TooltipContentProps,
  "side" | "sideOffset" | "align" | "alignOffset" | "children" | "className"
>

const Content: React.FC<ContentProps> = ({
  side = "top",
  sideOffset = 4,
  align,
  alignOffset,
  children,
  className,
}) => {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className={cx(
          "card-2 z-20 px-2.5 py-2 leading-none text-text animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2",
          className,
        )}
      >
        {children}
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  )
}

export const Tooltip = Object.assign(Root, {
  Trigger,
  Content,
})
