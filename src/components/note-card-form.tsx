import { ViewUpdate } from "@codemirror/view"
import { Vim } from "@replit/codemirror-vim"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import clsx from "clsx"
import { useAtomValue } from "jotai"
import React from "react"
import { githubRepoAtom } from "../global-state"
import { useAttachFile } from "../hooks/attach-file"
import { useSaveNote } from "../hooks/note"
import { NoteId } from "../schema"
import { getEditorSettings } from "../utils/editor-settings"
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
  onSubmit?: (note: { id: NoteId; content: string }) => void
  onCancel?: () => void
}

export function NoteCardForm({
  id: existingId,
  defaultValue = "",
  placeholder = "Write a note…",
  elevation = 1,
  minHeight,
  maxHeight,
  selected = false,
  autoFocus = false,
  editorRef: providedEditorRef,
  onSubmit,
  onCancel,
}: NoteCardFormProps) {
  const id = React.useMemo(() => existingId ?? Date.now().toString(), [existingId])
  const saveNote = useSaveNote()
  const githubRepo = useAtomValue(githubRepoAtom)
  const attachFile = useAttachFile()
  const vimMode = getEditorSettings().vimMode
  const newEditorRef = React.useRef<ReactCodeMirrorRef>(null)
  const editorRef = providedEditorRef ?? newEditorRef
  const [editorHasFocus, setEditorHasFocus] = React.useState(false)

  const handleStateChange = React.useCallback((event: ViewUpdate) => {
    setEditorHasFocus(event.view.hasFocus)
  }, [])

  function setValue(newValue: string) {
    const value = editorRef.current?.view?.state.doc.toString() ?? ""
    editorRef.current?.view?.dispatch({
      changes: [{ from: 0, to: value.length, insert: newValue }],
    })
  }

  function handleSubmit() {
    const value = editorRef.current?.view?.state.doc.toString() ?? ""

    // Don't create empty notes
    if (!value) return

    const note = { id, content: value }

    saveNote(note)
    onSubmit?.(note)
  }

  function handleCancel() {
    setValue(defaultValue)
    onCancel?.()
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
              if (vimMode) {
                // Submit on :w, :wq, :x
                Vim.defineEx("w", "w", handleSubmit)
                Vim.defineEx("wq", "wq", handleSubmit)
                Vim.defineEx("x", "x", handleSubmit)

                // Cancel on :q, :q!
                Vim.defineEx("q", "q", handleCancel)
                Vim.defineEx("q!", "q!", handleCancel)
              }

              // Submit on Command + Enter
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                handleSubmit()
                event.preventDefault()
              }

              // Cancel on Escape (unless in Vim mode is enabled)
              if (event.key === "Escape" && !vimMode) {
                handleCancel()
                event.stopPropagation()
              }
            }}
          >
            <div className="flex items-center justify-between p-2">
              <span className="px-2 font-mono tracking-wide text-text-secondary">{id}.md</span>
              <div className="flex gap-2">
                {onCancel ? (
                  <Button shortcut={vimMode ? [":", "q"] : ["esc"]} onClick={handleCancel}>
                    Cancel
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  variant="primary"
                  shortcut={vimMode ? [":", "x"] : ["⌘", "⏎"]}
                >
                  Save
                </Button>
              </div>
            </div>
            <NoteEditor
              ref={editorRef}
              className="flex flex-shrink-0 flex-grow px-4"
              defaultValue={defaultValue}
              placeholder={placeholder}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={autoFocus}
              onStateChange={handleStateChange}
            />
            <div className="flex p-2">
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
            </div>
          </form>
        </div>
      </div>
    </Card>
  )
}
