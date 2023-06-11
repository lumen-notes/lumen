import clsx from "clsx"
import React from "react"
import { DraggableCore } from "react-draggable"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { CloseIcon16, MoreIcon16 } from "./icons"
import { PanelContext } from "./panels"

type PanelProps = {
  id?: string
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  actions?: Array<{
    label: string
    disabled?: boolean
    icon?: React.ReactNode
    onSelect?: () => void
  }>
  onClose?: () => void
}

const MIN_WIDTH = 512
const MAX_WIDTH = Number.MAX_SAFE_INTEGER

export function Panel({
  id,
  title,
  description,
  icon,
  children,
  actions = [],
  onClose,
}: PanelProps) {
  const [width, setWidth] = React.useState(MIN_WIDTH)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const panel = React.useContext(PanelContext)
  const [activeNoteId, setActiveNoteId] = React.useState("")
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={panelRef}
      // Used to manage focus of panels
      data-panel
      // Used to restore focus to active note when moving focus between panels
      data-active-note-id={activeNoteId}
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
        if (event.key === "f" && event.metaKey) {
          const searchInput =
            panelRef.current?.querySelector<HTMLInputElement>("input[type=search]")
          if (searchInput) {
            searchInput.focus()
            event.preventDefault()
          }
        }

        // Focus prev/next note with `command + shift + up/down`
        if (
          (event.key === "ArrowUp" || event.key === "ArrowDown") &&
          event.metaKey &&
          event.shiftKey
        ) {
          const noteElements = Array.from(
            panelRef.current?.querySelectorAll<HTMLElement>("[data-note-id]") ?? [],
          )

          const focusedNoteElement = noteElements.find((noteElement) =>
            noteElement.contains(document.activeElement),
          )

          const focusedNoteIndex = focusedNoteElement
            ? noteElements.indexOf(focusedNoteElement)
            : -1

          if (event.key === "ArrowUp" && event.altKey) {
            const firstNote = noteElements[0]
            firstNote.focus()
            event.preventDefault()
          } else if (event.key === "ArrowDown" && event.altKey) {
            const lastNote = noteElements[noteElements.length - 1]
            lastNote.focus()
            event.preventDefault()
          } else if (event.key === "ArrowUp" && focusedNoteIndex > 0) {
            const prevNote = noteElements[focusedNoteIndex - 1]
            prevNote.focus()
            event.preventDefault()
          } else if (event.key === "ArrowDown" && focusedNoteIndex < noteElements.length - 1) {
            const nextNote = noteElements[focusedNoteIndex + 1]
            nextNote.focus()
            event.preventDefault()
          }
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
      {/* translateZ(0) fixes a bug in Safari where the scrollbar would appear underneath the sticky header */}
      <div className="flex h-full scroll-pb-4 scroll-pt-[4.5rem] flex-col overflow-auto coarse:[-webkit-transform:translateZ(0)]">
        <div
          className={
            "sticky top-0 z-10 flex h-[3.5rem] shrink-0 items-center justify-between gap-2 border-b border-border-secondary bg-gradient-to-b from-bg-inset to-bg-inset-backdrop p-4 backdrop-blur-md"
          }
        >
          <div className="flex flex-shrink items-center gap-2">
            <div className="flex-shrink-0 text-text-secondary">{icon}</div>
            <div className="flex items-baseline gap-3 overflow-hidden">
              <h2 className="flex-shrink-0 text-xl font-semibold leading-6">{title}</h2>
              {description ? (
                <span className="truncate text-text-secondary">{description}</span>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2">
            {actions.length > 0 ? (
              <DropdownMenu modal={false}>
                <DropdownMenu.Trigger asChild>
                  <IconButton aria-label="Panel actions" disableTooltip>
                    <MoreIcon16 />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  {actions.map(({ icon, label, disabled, onSelect }) => (
                    <DropdownMenu.Item
                      key={label}
                      icon={icon}
                      disabled={disabled}
                      onSelect={onSelect}
                    >
                      {label}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu>
            ) : null}
            {onClose ? (
              <IconButton aria-label="Close panel" shortcut={["⌘", "X"]} onClick={() => onClose()}>
                <CloseIcon16 />
              </IconButton>
            ) : null}
          </div>
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
            "absolute bottom-0 right-0 top-0 z-20 w-1 cursor-col-resize delay-75",
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
          // Ignore all modifier keys except shift
          if (event.metaKey || event.ctrlKey || event.altKey) {
            event.preventDefault()
            return
          }

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
