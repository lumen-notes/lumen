import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { useAtomValue } from "jotai"
import React from "react"
import { githubRepoAtom } from "../global-state"
import { NoteId } from "../schema"
import { useAttachFile } from "../utils/use-attach-file"
import { useSaveNote } from "../utils/use-save-note"
import { Button } from "./button"
import { Card } from "./card"
import { FileInputButton } from "./file-input-button"
import { IconButton } from "./icon-button"
import { PaperclipIcon16 } from "./icons"
import { NoteEditor } from "./note-editor"

type FullscreenNoteFormProps = {
  id?: NoteId
  defaultValue?: string
  placeholder?: string
  editorRef?: React.MutableRefObject<ReactCodeMirrorRef | null>
  onSubmit?: (note: { id: NoteId; content: string }) => void
  onCancel?: () => void
}

export function FullscreenNoteForm({
  id,
  defaultValue = "",
  placeholder = "Write a note…",
  editorRef: providedEditorRef,
  onSubmit,
  onCancel,
}: FullscreenNoteFormProps) {
  const githubRepo = useAtomValue(githubRepoAtom)
  const saveNote = useSaveNote()
  const attachFile = useAttachFile()
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)
  const newEditorRef = React.useRef<ReactCodeMirrorRef>(null)
  const editorRef = providedEditorRef ?? newEditorRef

  function handleSubmit() {
    const value = editorRef.current?.view?.state.doc.toString() ?? ""

    // Don't create empty notes
    if (!id && !value) return

    const note = {
      id: id ?? Date.now().toString(),
      content: value,
    }

    saveNote(note)
    onSubmit?.(note)
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <form
      className="relative flex h-full flex-grow flex-col bg-bg"
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
      onSubmit={(event) => {
        handleSubmit()
        event.preventDefault()
      }}
      onKeyDown={(event) => {
        // Submit on `command + enter`
        if ((event.key === "Enter" && event.metaKey) || (event.key === "s" && event.metaKey)) {
          handleSubmit()
          event.preventDefault()
        }

        // Cancel on `escape`
        if (event.key === "Escape") {
          onCancel?.()
        }
      }}
    >
      {/* Dropzone overlay */}
      {isDraggingOver ? (
        <div
          className="absolute inset-0 z-10 bg-bg-secondary"
          onDragLeave={(event) => {
            setIsDraggingOver(false)
            event.preventDefault()
          }}
        />
      ) : null}
      <div className="grid w-full flex-grow p-4">
        <NoteEditor
          ref={editorRef}
          className="flex h-full"
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
      </div>
      <div className="sticky bottom-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Card
          elevation={2}
          className="flex flex-shrink-0 justify-between gap-2 overflow-auto rounded-lg p-2"
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
            <Button variant="primary" shortcut={["⌘", "⏎"]} onClick={handleSubmit}>
              Save
            </Button>
          </div>
        </Card>
      </div>
    </form>
  )
}
