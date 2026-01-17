import { PreviewCard } from "@base-ui/react/preview-card"
import { Note } from "../schema"
import { cx } from "../utils/cx"
import { ErrorIcon16 } from "./icons"
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

function Provider({ children }: { children: React.ReactNode }) {
  return (
    <PreviewCard.Root>
      {({ payload }) => (
        <>
          {children}
          <PreviewCard.Portal>
            <PreviewCard.Positioner
              side={payload?.side ?? "bottom"}
              sideOffset={payload?.sideOffset ?? 4}
              align={payload?.align ?? "start"}
              alignOffset={payload?.alignOffset}
              anchor={payload?.anchor}
            >
              <PreviewCard.Popup
                className={cx(
                  "card-2 z-20 w-96 rounded-[calc(var(--border-radius-base)+6px)]! print:hidden",
                  "transition-[transform,scale,opacity]",
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
                  <span className="flex items-center gap-2 p-4 text-text-danger">
                    <ErrorIcon16 />
                    Note not found
                  </span>
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
    <PreviewCard.Trigger render={render} payload={payload}>
      {children}
    </PreviewCard.Trigger>
  )
}

export const NoteHoverCard = Object.assign({}, { Provider, Trigger })
