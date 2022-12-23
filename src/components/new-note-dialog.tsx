import { EditorView } from "@codemirror/view"
import * as Portal from "@radix-ui/react-portal"
import { TooltipContentProps } from "@radix-ui/react-tooltip"
import clsx from "clsx"
import React from "react"
import { DraggableCore } from "react-draggable"
import { IconButton } from "./button"
import { ComposeFillIcon24, ComposeIcon24 } from "./icons"
import { NoteForm } from "./note-form"

const DIALOG_WIDTH = 480

function initialPosition() {
  return {
    x: window.innerWidth / 2 - DIALOG_WIDTH / 2,
    y: 128,
  }
}

export function NewNoteDialog({ tooltipSide }: { tooltipSide?: TooltipContentProps["side"] }) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const prevActiveElement = React.useRef<HTMLElement>()
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState(() => initialPosition())
  const codeMirrorViewRef = React.useRef<EditorView>()

  const focusPrevActiveElement = React.useCallback(() => {
    prevActiveElement.current?.focus()
  }, [])

  const focusNoteEditor = React.useCallback(() => {
    codeMirrorViewRef.current?.focus()
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

  return (
    <>
      <IconButton
        ref={triggerRef}
        className={clsx("w-full", isOpen && "text-text")}
        aria-label="New note"
        shortcut={["⌘", "I"]}
        tooltipSide={tooltipSide}
        onClick={toggle}
      >
        {isOpen ? <ComposeFillIcon24 /> : <ComposeIcon24 />}
      </IconButton>
      {isOpen ? (
        <Portal.Root>
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
          >
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
              className="fixed z-20"
              style={{ top: position.y, left: position.x, width: DIALOG_WIDTH }}
            >
              <NoteForm
                elevation={2}
                editorMinHeight={96}
                codeMirrorViewRef={codeMirrorViewRef}
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
