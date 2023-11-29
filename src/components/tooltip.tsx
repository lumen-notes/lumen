import * as RadixTooltip from "@radix-ui/react-tooltip"
import React from "react"
import { cx } from "../utils/cx"
import { Card } from "./card"

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
        asChild
      >
        <Card
          elevation={2}
          className={cx(
            "z-20 rounded-md p-2 leading-none text-text animate-in fade-in after:rounded-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className,
          )}
        >
          {children}
        </Card>
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  )
}

export const Tooltip = Object.assign(Root, {
  Trigger,
  Content,
})
