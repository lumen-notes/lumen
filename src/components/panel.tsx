import clsx from "clsx"
import React from "react"
import { DraggableCore } from "react-draggable"
import { IconButton } from "./button"
import { CloseIcon16 } from "./icons"
import { PanelContext } from "./panels"

type PanelProps = {
  id?: string
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  onClose?: () => void
}

const MIN_WIDTH = 512
const MAX_WIDTH = Number.MAX_SAFE_INTEGER

export function Panel({ id, title, description, icon, children, onClose }: PanelProps) {
  const [width, setWidth] = React.useState(MIN_WIDTH)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const panel = React.useContext(PanelContext)
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={panelRef}
      data-panel // Data attribute used to manage focus
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      id={id}
      className="sticky left-0 h-full w-screen flex-shrink-0 snap-center bg-bg-inset shadow-lg ring-1 ring-border-secondary focus:outline-none sm:left-[var(--left)] sm:w-[var(--width)]"
      style={{
        // @ts-ignore TypeScript doesn't know about custom properties
        "--width": `${width}px`,
        // Stagger sticky offset of panels
        "--left": panel ? `${(panel.index + 1) * 8}px` : 0,
      }}
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
      <div className="hidden sm:block">
        <ResizeHandle
          value={width}
          min={MIN_WIDTH}
          max={MAX_WIDTH}
          onChange={setWidth}
          onSnap={(direction) => {
            switch (direction) {
              case "left": {
                setWidth(MIN_WIDTH)
                break
              }

              // Fill the remaining space to the right
              case "right": {
                if (!panelRef.current) break

                const panelRect = panelRef.current.getBoundingClientRect()
                setWidth(Math.max(window.innerWidth - panelRect.x, MIN_WIDTH))
                break
              }
            }
          }}
        />
      </div>
      <div className="flex h-full flex-col overflow-auto [-webkit-transform:translateZ(0)]">
        <div
          className={
            "sticky top-0 z-10 flex h-[3.5rem] shrink-0 items-center justify-between gap-2 border-b border-border-secondary bg-gradient-to-b from-bg-inset to-bg-inset-backdrop p-4 backdrop-blur-md"
          }
        >
          <div className="flex flex-shrink gap-2">
            <div className="flex-shrink-0 text-text-secondary">{icon}</div>
            <div className="flex items-baseline gap-3 overflow-hidden">
              {/* TODO: Truncate title */}
              <h2 className="flex-shrink-0 text-lg font-semibold leading-6">{title}</h2>
              {description ? (
                <span className="truncate text-text-secondary">{description}</span>
              ) : null}
            </div>
          </div>
          {onClose ? (
            <IconButton aria-label="Close panel" shortcut={["⌘", "X"]} onClick={() => onClose()}>
              <CloseIcon16 />
            </IconButton>
          ) : null}
        </div>
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  )
}

function ResizeHandle({
  value,
  min,
  max,
  step = 16,
  onChange,
  onSnap,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  onSnap?: (direction: "left" | "right") => void
}) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const isResizing = isDragging || isFocused
  const handleRef = React.useRef<HTMLDivElement>(null)
  const sliderRef = React.useRef<HTMLInputElement>(null)
  return (
    <>
      <DraggableCore
        onStart={() => setIsDragging(true)}
        onStop={() => {
          setIsDragging(false)
          sliderRef.current?.focus()
        }}
        onDrag={(event, { deltaX }) => {
          onChange(clamp(value + deltaX, min, max))
          event.preventDefault()
        }}
      >
        <div
          ref={handleRef}
          data-resizing={isDragging}
          className={clsx(
            "absolute top-0 bottom-0 right-0 z-20 w-1 cursor-col-resize delay-75",
            !isResizing && "hover:bg-bg-secondary",
            isResizing && "bg-border-focus",
          )}
        />
      </DraggableCore>
      <input
        ref={sliderRef}
        className="sr-only"
        aria-label="Resize panel"
        type="range"
        onFocus={() => {
          setIsFocused(true)
          handleRef.current?.scrollIntoView()
        }}
        onBlur={() => setIsFocused(false)}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        onKeyDown={(event) => {
          if (event.shiftKey) {
            switch (event.key) {
              case "ArrowLeft":
              case "ArrowDown":
                onSnap?.("left")
                event.preventDefault()
                break

              case "ArrowRight":
              case "ArrowUp":
                onSnap?.("right")
                event.preventDefault()
                break
            }
          }
        }}
        step={step}
      />
    </>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
