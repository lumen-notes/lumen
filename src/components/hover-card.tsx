import { PreviewCard } from "@base-ui/react/preview-card"
import { cx } from "../utils/cx"

type Payload = {
  content: React.ReactNode
  popupClassName?: string
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
  anchor?: Element | null
  transformOrigin?: string
}

function Provider({
  children,
  container,
}: {
  children: React.ReactNode
  container?: HTMLElement | null
}) {
  return (
    <PreviewCard.Root<Payload>>
      {({ payload }) => (
        <>
          {children}
          <PreviewCard.Portal container={container}>
            <PreviewCard.Positioner
              side={payload?.side ?? "bottom"}
              sideOffset={payload?.sideOffset ?? 4}
              align={payload?.align ?? "start"}
              alignOffset={payload?.alignOffset}
              anchor={payload?.anchor}
            >
              <PreviewCard.Popup
                className={cx(
                  "card-2 z-30 print:hidden no-hover:hidden",
                  "transition-[transform,scale,opacity] epaper:transition-none",
                  "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
                  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                  payload?.popupClassName,
                )}
                style={{
                  transformOrigin: payload?.transformOrigin ?? "var(--transform-origin)",
                }}
              >
                {payload?.content}
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </>
      )}
    </PreviewCard.Root>
  )
}

function Trigger({
  render,
  payload,
  children,
}: {
  render: React.ReactElement
  payload: Payload
  children: React.ReactNode
}) {
  return (
    <PreviewCard.Trigger<Payload> render={render} payload={payload}>
      {children}
    </PreviewCard.Trigger>
  )
}

export const HoverCard = Object.assign({}, { Provider, Trigger })
