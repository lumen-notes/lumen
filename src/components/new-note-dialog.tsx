import { EditorView } from "@codemirror/view"
import * as Portal from "@radix-ui/react-portal"
import { TooltipContentProps } from "@radix-ui/react-tooltip"
import clsx from "clsx"
import React from "react"
import { DraggableCore } from "react-draggable"
import { useMedia } from "react-use"
import { IconButton } from "./button"
import { ComposeFillIcon24, ComposeIcon24 } from "./icons"
import { NoteForm } from "./note-form"

const NewNoteDialogContext = React.createContext<{
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggle: () => void
  position: { x: number; y: number }
  setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  editorRef: React.MutableRefObject<EditorView | undefined>
  triggerRef: React.RefObject<HTMLButtonElement>
  focusNoteCard: (id: string) => void
  focusNoteEditor: () => void
  focusPrevActiveElement: () => void
}>({
  isOpen: false,
  setIsOpen: () => {},
  toggle: () => {},
  position: { x: 0, y: 0 },
  setPosition: () => {},
  editorRef: { current: undefined },
  triggerRef: React.createRef(),
  focusNoteCard: () => {},
  focusNoteEditor: () => {},
  focusPrevActiveElement: () => {},
})

const DIALOG_WIDTH = 480

function initialPosition() {
  return {
    x: window.innerWidth / 2 - DIALOG_WIDTH / 2,
    y: 128,
  }
}

function Provider({ children }: { children: React.ReactNode }) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const prevActiveElement = React.useRef<HTMLElement>()
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState(() => initialPosition())
  const editorRef = React.useRef<EditorView>()

  const focusPrevActiveElement = React.useCallback(() => {
    prevActiveElement.current?.focus()
  }, [])

  const focusNoteEditor = React.useCallback(() => {
    editorRef.current?.focus()
  }, [])

  const focusNoteCard = React.useCallback(
    (id: string) => {
      const noteElement = document.querySelector(`[data-note-id="${id}"]`)
      if (noteElement instanceof HTMLElement) {
        noteElement.focus()
      } else {
        // Fallback to previous active element
        focusPrevActiveElement()
      }
    },
    [focusPrevActiveElement],
  )

  const toggle = React.useCallback(() => {
    if (isOpen) {
      setIsOpen(false)
      focusPrevActiveElement()
    } else {
      prevActiveElement.current = document.activeElement as HTMLElement
      setIsOpen(true)
      setPosition(initialPosition())
      setTimeout(() => focusNoteEditor())
    }
  }, [isOpen, focusPrevActiveElement, focusNoteEditor])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Toggle with `command + i`
      if (event.key === "i" && event.metaKey) {
        toggle()
        event.preventDefault()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toggle])

  const contextValue = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      toggle,
      position,
      setPosition,
      editorRef,
      triggerRef,
      focusNoteCard,
      focusNoteEditor,
      focusPrevActiveElement,
    }),
    [
      isOpen,
      setIsOpen,
      toggle,
      position,
      setPosition,
      editorRef,
      triggerRef,
      focusNoteCard,
      focusNoteEditor,
      focusPrevActiveElement,
    ],
  )

  return (
    <NewNoteDialogContext.Provider value={contextValue}>{children}</NewNoteDialogContext.Provider>
  )
}

// TODO: Support mobile viewports
function Dialog({ tooltipSide }: { tooltipSide?: TooltipContentProps["side"] }) {
  const {
    isOpen,
    setIsOpen,
    position,
    setPosition,
    editorRef,
    focusNoteCard,
    focusNoteEditor,
    focusPrevActiveElement,
  } = React.useContext(NewNoteDialogContext)
  // We consider any viewport wider than 640px a desktop viewport.
  // This breakpoint is copied from Tailwind's default breakpoints.
  // Reference: https://tailwindcss.com/docs/responsive-design
  const isDesktop = useMedia("(min-width: 640px)")

  return (
    <>
      {isOpen ? (
        <Portal.Root>
          {/* Overlay */}
          <div className="fixed inset-0 bg-bg-inset-backdrop backdrop-blur-md sm:hidden" />
          <DraggableCore
            onDrag={(event, data) =>
              setPosition({
                x: position.x + data.deltaX,
                y: position.y + data.deltaY,
              })
            }
            onStop={() => focusNoteEditor()}
            // Ignore drag events in the note editor
            cancel=".cm-editor"
            disabled={!isDesktop}
          >
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
              className="fixed top-4 left-4 right-4 z-20 sm:right-[unset] sm:top-[var(--top)] sm:left-[var(--left)] sm:w-[var(--width)]"
              style={{
                // @ts-ignore
                "--top": `${position.y}px`,
                "--left": `${position.x}px`,
                "--width": `${DIALOG_WIDTH}px`,
              }}
            >
              <NoteForm
                elevation={2}
                minHeight="12rem"
                maxHeight="50vh"
                codeMirrorViewRef={editorRef}
                onSubmit={({ id }) => {
                  setIsOpen(false)
                  setTimeout(() => focusNoteCard(id))
                }}
                onCancel={() => {
                  setIsOpen(false)
                  focusPrevActiveElement()
                }}
              />
            </div>
          </DraggableCore>
        </Portal.Root>
      ) : null}
    </>
  )
}

function Trigger({
  className,
  tooltipSide,
}: {
  className?: string
  tooltipSide?: TooltipContentProps["side"]
}) {
  const { isOpen, toggle, triggerRef } = React.useContext(NewNoteDialogContext)
  return (
    <IconButton
      ref={triggerRef}
      className={clsx(isOpen && "text-text", className)}
      aria-label="New note"
      shortcut={["⌘", "I"]}
      tooltipSide={tooltipSide}
      onClick={toggle}
    >
      {isOpen ? <ComposeFillIcon24 /> : <ComposeIcon24 />}
    </IconButton>
  )
}

export const NewNoteDialog = Object.assign(Dialog, { Provider, Trigger })
