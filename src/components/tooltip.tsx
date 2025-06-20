import { Tooltip as BaseTooltip } from "@base-ui/react/Tooltip"
import React from "react"
import { cx } from "../utils/cx"

const Root = BaseTooltip.Root

const Trigger = BaseTooltip.Trigger

type ContentProps = {
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
  children: React.ReactNode
  className?: string
}

const Content: React.FC<ContentProps> = ({
  side = "top",
  sideOffset = 4,
  align,
  alignOffset,
  children,
  className,
}) => {
  return (
    <BaseTooltip.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} className="z-20">
      <BaseTooltip.Popup
        className={cx(
          "card-2 px-2.5 py-2 leading-none text-text animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2",
          className,
        )}
      >
        {children}
      </BaseTooltip.Popup>
    </BaseTooltip.Positioner>
  )
}

export const Tooltip = Object.assign(Root, {
  Trigger,
  Content,
})
