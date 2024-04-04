import clsx from "clsx"
import React from "react"
import { DraggableCore } from "react-draggable"
import { z } from "zod"
import { useSearchParam } from "../hooks/search-param"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { CloseIcon16, MoreIcon16 } from "./icons"
import { Panels, usePanel } from "./panels"
import { cx } from "../utils/cx"

type PanelProps = {
  id?: string
  className?: string
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  onClose?: () => void
}

const MIN_WIDTH = 560
const MAX_WIDTH = Number.MAX_SAFE_INTEGER

export function Panel({
  id,
  className,
  title,
  description,
  icon,
  actions,
  children,
  onClose,
}: PanelProps) {
  const [widthParam, setWidthParam] = useSearchParam("w", {
    validate: z.string().catch(String(MIN_WIDTH)).parse,
  })

  const [width, setWidth] = React.useState(parseInt(widthParam))
  const panelRef = React.useRef<HTMLDivElement>(null)
  const panel = usePanel()
  const [activeNoteId, setActiveNoteId] = React.useState("")

  return (
    <Panels.LinkProvider>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={panelRef}
        // Used to manage focus of panels
        data-panel
        // Used to restore focus to active note when moving focus between panels
        data-active-note-id={activeNoteId}
        id={id}
        className={cx(
          "sticky left-0 h-full w-screen flex-shrink-0 snap-center border-border-secondary bg-bg-inset focus:outline-none sm:left-[var(--left)] sm:w-[var(--width)] sm:[&:not(:first-of-type)]:border-l [&:not(:last-of-type)]:hidden sm:[&:not(:last-of-type)]:block",
          className,
        )}
        style={{
          // @ts-ignore TypeScript doesn't know about custom properties
          "--width": `max(${MIN_WIDTH}px, ${width}px)`,
          // Stagger sticky offset of panels
          "--left": panel ? `${(panel.index + 1) * 44}px` : 0,
        }}
        onKeyDown={(event) => {
          // Close with Command + X if no text is selected
          if (event.metaKey && event.key === "x" && !window.getSelection()?.toString()) {
            onClose?.()
            event.preventDefault()
          }
        }}
        onFocus={() => {
          setActiveNoteId(
            document.activeElement?.closest<HTMLElement>("[data-note-id]")?.dataset.noteId ?? "",
          )
        }}
      >
        <div className="hidden sm:block">
          <ResizeHandle
            value={width}
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            onChange={setWidth}
            onStop={() => {
              const panelRect = panelRef.current?.getBoundingClientRect()

              if (panelRect) {
                setWidth(panelRect.width)
                setWidthParam(String(panelRect.width))
              }
            }}
          />
        </div>
        {/* translateZ(0) fixes a bug in Safari where the scrollbar would appear underneath the sticky header */}
        <div className="flex h-full scroll-pb-4 scroll-pt-[4.5rem] flex-col overflow-auto coarse:[-webkit-transform:translateZ(0)]">
          <div
            className={
              "sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border-secondary bg-bg-inset p-2 pl-4 coarse:h-14"
            }
          >
            <div className="flex flex-shrink items-center gap-3">
              <div className="flex-shrink-0 text-text-secondary">{icon}</div>
              <div className="flex items-baseline gap-3 overflow-hidden">
                <h2 className="flex-shrink-0 text-lg font-semibold leading-6">{title}</h2>
                {description ? (
                  <span className="truncate text-text-secondary">{description}</span>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              {actions ? (
                <DropdownMenu modal={false}>
                  <DropdownMenu.Trigger asChild>
                    <IconButton aria-label="Panel actions" disableTooltip>
                      <MoreIcon16 />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">{actions}</DropdownMenu.Content>
                </DropdownMenu>
              ) : null}
              {onClose ? (
                <IconButton aria-label="Close" shortcut={["⌘", "X"]} onClick={() => onClose()}>
                  <CloseIcon16 />
                </IconButton>
              ) : null}
            </div>
          </div>
          <div className="flex-grow">{children}</div>
        </div>
      </div>
    </Panels.LinkProvider>
  )
}

function ResizeHandle({
  value,
  onChange,
  onStop,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  onStop?: () => void
}) {
  const draggableRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const isResizing = isDragging
  return (
    <DraggableCore
      nodeRef={draggableRef}
      onStart={() => setIsDragging(true)}
      onStop={() => {
        setIsDragging(false)
        onStop?.()
      }}
      onDrag={(event, { deltaX }) => {
        onChange(value + deltaX)
        event.preventDefault()
      }}
    >
      <div
        ref={draggableRef}
        data-resizing={isDragging}
        className={clsx(
          "absolute bottom-0 right-0 top-0 z-20 w-1 cursor-col-resize delay-75",
          !isResizing && "hover:bg-border-secondary",
          isResizing && "bg-border-focus",
        )}
      />
    </DraggableCore>
  )
}
