import { PreviewCard } from "@base-ui/react/preview-card"
import { Note } from "../schema"
import { cx } from "../utils/cx"
import { NotePreview } from "./note-preview"

type Payload = {
  note: Note | null
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
                  "card-2 z-30 w-96 rounded-[calc(var(--border-radius-base)+6px)]! print:hidden coarse:hidden",
                  "transition-[transform,scale,opacity] epaper:transition-none",
                  "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
                  "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
                )}
                style={{
                  transformOrigin: payload?.transformOrigin ?? "var(--transform-origin)",
                }}
              >
                {payload?.note ? (
                  <NotePreview note={payload.note} />
                ) : (
                  <div className="p-4 text-text-secondary">Note not found</div>
                )}
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

export const NoteHoverCard = Object.assign({}, { Provider, Trigger })
