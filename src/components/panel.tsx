import clsx from "clsx"
import React from "react"
import { DraggableCore } from "react-draggable"
import { IconButton } from "./button"
import { CloseIcon16 } from "./icons"

type PanelProps = {
  id?: string
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  onClose?: () => void
}

const MIN_WIDTH = 512
const MAX_WIDTH = 800

export function Panel({ id, title, description, icon, children, onClose }: PanelProps) {
  const [isResizing, setIsResizing] = React.useState(false)
  const [width, setWidth] = React.useState(MIN_WIDTH)
  const panelRef = React.useRef<HTMLDivElement>(null)
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={panelRef}
      data-panel // Data attribute used to manage focus
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      id={id}
      className="relative h-full w-[80vw] flex-shrink-0 border-r border-border-divider focus:outline-none"
      style={{ maxWidth: width }}
      onKeyDown={(event) => {
        // Close with `command + x` if no text is selected
        if (event.metaKey && event.key === "x" && !window.getSelection()?.toString()) {
          onClose?.()
          event.preventDefault()
        }

        // Focus search input with `command + f`
        if (event.metaKey && event.key === "f") {
          const searchInput =
            panelRef.current?.querySelector<HTMLInputElement>("input[type=search]")
          if (searchInput) {
            searchInput.focus()
            event.preventDefault()
          }
        }
      }}
    >
      {/* TODO: Resize with keyboard */}
      <DraggableCore
        onStart={() => setIsResizing(true)}
        onStop={() => setIsResizing(false)}
        onDrag={(event, { deltaX }) => {
          setWidth((width) => clamp(width + deltaX, MIN_WIDTH, MAX_WIDTH))
          event.preventDefault()
        }}
      >
        <div
          data-resizing={isResizing}
          className={clsx(
            "absolute top-0 bottom-0 right-0 z-20 w-1 cursor-col-resize",
            !isResizing && "hover:bg-bg-hover",
            isResizing && "bg-border-divider",
          )}
        />
      </DraggableCore>
      <div
        className={clsx(
          "flex h-full flex-col overflow-auto",
          // isResizing && "[&::-webkit-scrollbar]:hidden",
        )}
      >
        <div
          className={clsx(
            "sticky top-0 z-10 flex h-[3.5rem] shrink-0 items-center justify-between gap-2 border-b border-border-divider bg-bg-backdrop p-4 backdrop-blur-md",
          )}
        >
          <div className="flex flex-shrink gap-2">
            <div className="flex-shrink-0">{icon}</div>
            <div className="flex items-baseline gap-3">
              <h2 className="flex-shrink-0 text-lg font-semibold leading-6">{title}</h2>
              {description ? <span className="truncate text-text-muted">{description}</span> : null}
            </div>
          </div>
          {onClose ? (
            <IconButton aria-label="Close panel" shortcut="⌘X" onClick={() => onClose()}>
              <CloseIcon16 />
            </IconButton>
          ) : null}
        </div>
        <div className="flex-grow p-4">{children}</div>
      </div>
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
