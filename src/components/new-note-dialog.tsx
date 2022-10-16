import { EditorView } from "@codemirror/view"
import * as Portal from "@radix-ui/react-portal"
import React from "react"
import { DraggableCore } from "react-draggable"
import { IconButton } from "./button"
import { ComposeIcon24 } from "./icons"
import { NoteForm } from "./note-form"

const DIALOG_WIDTH = 480

function initialPosition() {
  return {
    x: window.innerWidth / 2 - DIALOG_WIDTH / 2,
    y: 128,
  }
}

export function NewNoteDialog() {
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
        aria-label="New note"
        shortcut={["⌘", "I"]}
        tooltipSide="right"
        onClick={toggle}
      >
        <ComposeIcon24 />
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
          >
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
              className="fixed z-20"
              style={{ top: position.y, left: position.x, width: DIALOG_WIDTH }}
              onKeyDown={(event) => {
                if (!event.metaKey) return

                // Hold `shift` to increase step size
                const step = event.shiftKey ? 128 : 16

                // Move dialog with `command + arrow`
                switch (event.key) {
                  case "ArrowUp":
                    setPosition({ x: position.x, y: position.y - step })
                    event.preventDefault()
                    break

                  case "ArrowRight":
                    setPosition({ x: position.x + step, y: position.y })
                    event.preventDefault()
                    break

                  case "ArrowDown":
                    setPosition({ x: position.x, y: position.y + step })
                    event.preventDefault()
                    break

                  case "ArrowLeft":
                    setPosition({ x: position.x - step, y: position.y })
                    event.preventDefault()
                    break
                }
              }}
            >
              <NoteForm
                elevation={2}
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
