import { EditorView } from "@codemirror/view"
import * as Portal from "@radix-ui/react-portal"
import { TooltipContentProps } from "@radix-ui/react-tooltip"
import clsx from "clsx"
import { useAtomValue } from "jotai"
import React from "react"
import { DraggableCore } from "react-draggable"
import { useLocation, useNavigate } from "react-router-dom"
import { useMedia } from "react-use"
import { githubRepoAtom, githubUserAtom } from "../global-atoms"
import { useIsFullscreen } from "../utils/use-is-fullscreen"
import { IconButton } from "./icon-button"
import { ComposeFillIcon24, ComposeIcon24 } from "./icons"
import { NoteCardForm } from "./note-card-form"
import { openNewWindow } from "../utils/open-new-window"

const NewNoteDialogContext = React.createContext<{
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  disabled: boolean
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
  disabled: false,
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
  return { x: 0, y: 0 }
}

function Provider({ children }: { children: React.ReactNode }) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const prevActiveElement = React.useRef<HTMLElement>()
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState(() => initialPosition())
  const editorRef = React.useRef<EditorView>()
  const isFullscreen = useIsFullscreen()
  const location = useLocation()
  const navigate = useNavigate()

  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const disabled = !githubUser || !githubRepo || location.pathname === "/new"

  const focusPrevActiveElement = React.useCallback(() => {
    prevActiveElement.current?.focus()
  }, [])

  const focusNoteEditor = React.useCallback(() => {
    editorRef.current?.focus()
  }, [])

  const focusNoteCard = React.useCallback(
    (id: string) => {
      // If we're in fullscreen mode, navigate to the new note
      if (isFullscreen) {
        navigate(`/${id}?fullscreen=true`)
        return
      }

      const noteElement = document.querySelector(`[data-note-id="${id}"]`)

      if (noteElement instanceof HTMLElement) {
        noteElement.focus()
      } else {
        // Fallback to previous active element
        focusPrevActiveElement()
      }
    },
    [isFullscreen, navigate, focusPrevActiveElement],
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
      if (event.key === "i" && event.metaKey && !event.shiftKey && !disabled) {
        toggle()
        event.preventDefault()
      }

      // Open /new with `command + shift + i`
      if (event.key === "i" && event.metaKey && event.shiftKey && !disabled) {
        openNewWindow("/new")
        event.preventDefault()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toggle, navigate, disabled])

  const contextValue = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      disabled,
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
      disabled,
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

function Dialog() {
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
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="fixed inset-0 z-10 bg-bg-inset-backdrop animate-in fade-in sm:hidden" />
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
              className="fixed left-2 right-2 top-2 z-20 sm:left-[calc(50vw_+_var(--left)_-_var(--width)_/_2)] sm:right-[unset] sm:top-[calc(128px_+_var(--top))] sm:w-[var(--width)]"
              style={{
                // @ts-ignore
                "--top": `${position.y}px`,
                "--left": `${position.x}px`,
                "--width": `${DIALOG_WIDTH}px`,
              }}
            >
              <NoteCardForm
                elevation={2}
                minHeight={isDesktop ? "16rem" : "50vh"}
                maxHeight="50vh"
                editorRef={editorRef}
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
  const { isOpen, disabled, toggle, triggerRef } = React.useContext(NewNoteDialogContext)
  return (
    <IconButton
      ref={triggerRef}
      className={clsx(isOpen && "text-text", className)}
      aria-label="New note"
      shortcut={["⌘", "I"]}
      tooltipSide={tooltipSide}
      onClick={toggle}
      disabled={disabled}
    >
      {isOpen ? <ComposeFillIcon24 /> : <ComposeIcon24 />}
    </IconButton>
  )
}

export const NewNoteDialog = Object.assign(Dialog, { Provider, Trigger })
