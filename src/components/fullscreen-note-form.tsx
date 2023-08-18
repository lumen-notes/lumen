import { EditorView } from "@codemirror/view"
import { useAtomValue } from "jotai"
import React from "react"
import { githubRepoAtom } from "../global-atoms"
import { NoteId } from "../types"
import { useUpsertNote } from "../utils/github-sync"
import { useAttachFile } from "../utils/use-attach-file"
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
  editorRef?: React.MutableRefObject<EditorView | undefined>
  onSubmit?: (note: { id: NoteId; rawBody: string }) => void
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
  const upsertNote = useUpsertNote()
  const attachFile = useAttachFile()
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)
  const newEditorRef = React.useRef<EditorView>()
  const editorRef = providedEditorRef ?? newEditorRef

  function handleSubmit() {
    const value = editorRef.current?.state.doc.toString() ?? ""

    // Don't create empty notes
    if (!id && !value) return

    const note = {
      id: id ?? Date.now().toString(),
      rawBody: value,
    }

    upsertNote(note)

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
          attachFile(file, editorRef.current)
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
          className="flex h-full"
          placeholder={placeholder}
          editorRef={editorRef}
          defaultValue={defaultValue}
        />
      </div>
      <div className="sticky bottom-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Card
          elevation={1}
          className="flex flex-shrink-0 justify-between gap-2 overflow-auto rounded-lg bg-bg-overlay-backdrop p-2 backdrop-blur-md"
        >
          <FileInputButton
            asChild
            onChange={(files) => {
              if (!files) return

              const [file] = Array.from(files)

              if (file) {
                attachFile(file, editorRef.current)
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
              {id ? "Save" : "Add"}
            </Button>
          </div>
        </Card>
      </div>
    </form>
  )
}
