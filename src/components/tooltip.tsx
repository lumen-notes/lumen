import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip"
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
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
      >
        <BaseTooltip.Popup
          className={cx(
            "card-2 z-20 px-2.5 py-2 leading-none text-text origin-[var(--transform-origin)] transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
            className,
          )}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
}

export const Tooltip = Object.assign(Root, {
  Trigger,
  Content,
})
