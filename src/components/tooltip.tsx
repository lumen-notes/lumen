import * as RadixTooltip from "@radix-ui/react-tooltip"
import React from "react"
import { Card } from "./card"

const Root = RadixTooltip.Root

const Trigger = RadixTooltip.Trigger

type ContentProps = Pick<
  RadixTooltip.TooltipContentProps,
  "side" | "sideOffset" | "align" | "alignOffset" | "children"
>

const Content: React.FC<ContentProps> = ({
  side = "top",
  sideOffset = 4,
  align,
  alignOffset,
  children,
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
        <Card elevation={1} className="z-10 py-1 px-2 text-text-muted">
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
