import { ViewUpdate } from "@codemirror/view"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import clsx from "clsx"
import { useAtomValue } from "jotai"
import React from "react"
import { githubRepoAtom } from "../global-atoms"
import { NoteId } from "../types"
import { useUpsertNote } from "../utils/github-sync"
import { useAttachFile } from "../utils/use-attach-file"
import { Button } from "./button"
import { Card, CardProps } from "./card"
import { FileInputButton } from "./file-input-button"
import { IconButton } from "./icon-button"
import { PaperclipIcon16 } from "./icons"
import { NoteEditor } from "./note-editor"

type NoteCardFormProps = {
  id?: NoteId
  defaultValue?: string
  placeholder?: string
  elevation?: CardProps["elevation"]
  minHeight?: string | number
  maxHeight?: string | number
  selected?: boolean
  autoFocus?: boolean
  editorRef?: React.MutableRefObject<ReactCodeMirrorRef | null>
  onSubmit?: (note: { id: NoteId; rawBody: string }) => void
  onCancel?: () => void
}

export function NoteCardForm({
  id,
  defaultValue = "",
  placeholder = "Write a note…",
  elevation = 0,
  minHeight,
  maxHeight,
  selected = false,
  autoFocus = false,
  editorRef: providedEditorRef,
  onSubmit,
  onCancel,
}: NoteCardFormProps) {
  const githubRepo = useAtomValue(githubRepoAtom)
  const upsertNote = useUpsertNote()
  const attachFile = useAttachFile()

  const newEditorRef = React.useRef<ReactCodeMirrorRef>(null)
  const editorRef = providedEditorRef ?? newEditorRef
  const [editorHasFocus, setEditorHasFocus] = React.useState(false)

  const handleStateChange = React.useCallback((event: ViewUpdate) => {
    setEditorHasFocus(event.view.hasFocus)
  }, [])

  function setValue(newValue: string) {
    const value = editorRef.current?.state?.doc.toString() ?? ""
    editorRef.current?.view?.dispatch({
      changes: [{ from: 0, to: value.length, insert: newValue }],
    })
  }

  function handleSubmit() {
    const value = editorRef.current?.view?.state.doc.toString() ?? ""

    // Don't create empty notes
    if (!value) return

    const note = {
      id: id ?? Date.now().toString(),
      rawBody: value,
    }

    upsertNote(note)

    onSubmit?.(note)

    // If we're creating a new note, reset the form after submitting
    if (!id) {
      setValue(defaultValue)
    }
  }

  const [isDraggingOver, setIsDraggingOver] = React.useState(false)

  return (
    <Card
      elevation={elevation}
      focusVisible={editorHasFocus || selected}
      className="relative flex flex-col"
      // Reference: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
      onDrop={(event) => {
        const [item] = Array.from(event.dataTransfer.items)
        const file = item.getAsFile()

        if (file) {
          attachFile(file, editorRef.current?.view)
          event.preventDefault()
        }

        setIsDraggingOver(false)
      }}
      onDragOver={(event) => {
        // Allow drop event
        event.preventDefault()
      }}
      onDragEnter={(event) => {
        setIsDraggingOver(true)
        event.preventDefault()
      }}
    >
      {/* Dropzone overlay */}
      {isDraggingOver ? (
        <div
          className="absolute inset-0 z-10 rounded-lg bg-bg-secondary"
          onDragLeave={(event) => {
            setIsDraggingOver(false)
            event.preventDefault()
          }}
        />
      ) : null}

      <div className={clsx("rounded-lg", maxHeight !== undefined && "overflow-hidden")}>
        <div
          className={clsx(
            "flex flex-col",
            maxHeight !== undefined && "scroll-pb-[3.5rem] overflow-auto",
          )}
          style={{ minHeight, maxHeight }}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <form
            className="flex flex-grow flex-col"
            onSubmit={(event) => {
              handleSubmit()
              event.preventDefault()
            }}
            onKeyDown={(event) => {
              // Submit on `command + enter`
              if (event.key === "Enter" && event.metaKey) {
                handleSubmit()
                event.preventDefault()
              }

              // Clear and cancel on `escape`
              if (event.key === "Escape") {
                setValue("")
                onCancel?.()
              }
            }}
          >
            <NoteEditor
              ref={editorRef}
              className="flex flex-shrink-0 flex-grow p-4 pb-1"
              defaultValue={defaultValue}
              placeholder={placeholder}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={autoFocus}
              onStateChange={handleStateChange}
            />
            <div
              className={clsx(
                "sticky bottom-0 flex justify-between rounded-lg p-2 backdrop-blur-md",
                elevation === 0 && "bg-bg-backdrop",
                elevation === 1 && "bg-bg-overlay-backdrop",
              )}
            >
              <FileInputButton
                asChild
                onChange={(files) => {
                  if (!files) return

                  const [file] = Array.from(files)

                  if (file) {
                    attachFile(file, editorRef.current?.view)
                  }
                }}
              >
                <IconButton aria-label="Attach file" disabled={!githubRepo}>
                  <PaperclipIcon16 />
                </IconButton>
              </FileInputButton>
              <div className="flex gap-2">
                {onCancel ? (
                  <Button shortcut={["esc"]} onClick={onCancel}>
                    Cancel
                  </Button>
                ) : null}
                <Button type="submit" variant="primary" shortcut={["⌘", "⏎"]}>
                  {id ? "Save" : "Add"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Card>
  )
}
