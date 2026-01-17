import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip"
import { cx } from "../utils/cx"

type ContentProps = {
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
  children?: React.ReactNode
  className?: string
}

function Content({
  side = "top",
  sideOffset = 4,
  align,
  alignOffset,
  children,
  className,
}: ContentProps) {
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
            "card-2 z-20 px-2.5 py-2 leading-none text-text",
            "origin-[var(--transform-origin)] transition-[transform,scale,opacity] epaper:transition-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className,
          )}
        >
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
}

function Trigger({ render, children, ...props }: BaseTooltip.Trigger.Props) {
  return (
    <BaseTooltip.Trigger render={render} {...props}>
      {children}
    </BaseTooltip.Trigger>
  )
}

export const Tooltip = Object.assign(BaseTooltip.Root, {
  Trigger,
  Content,
})
