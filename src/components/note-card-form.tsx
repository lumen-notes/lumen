import { EditorView, ViewUpdate } from "@codemirror/view"
import clsx from "clsx"
import { useAtomValue } from "jotai"
import { useAtomCallback } from "jotai/utils"
import React from "react"
import { githubRepoAtom, githubTokenAtom } from "../global-atoms"
import { NoteId } from "../types"
import { writeFile } from "../utils/github-fs"
import { useUpsertNote } from "../utils/github-sync"
import { Button } from "./button"
import { Card, CardProps } from "./card"
import { FileInputButton } from "./file-input-button"
import { fileCache } from "./file-preview"
import { IconButton } from "./icon-button"
import { PaperclipIcon16 } from "./icons"
import { NoteEditor } from "./note-editor"

const UPLOADS_DIRECTORY = "uploads"

type NoteCardFormProps = {
  id?: NoteId
  defaultValue?: string
  placeholder?: string
  elevation?: CardProps["elevation"]
  minHeight?: string | number
  maxHeight?: string | number
  editorRef?: React.MutableRefObject<EditorView | undefined>
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
  editorRef: providedEditorRef,
  onSubmit,
  onCancel,
}: NoteCardFormProps) {
  const githubRepo = useAtomValue(githubRepoAtom)
  const upsertNote = useUpsertNote()
  const attachFile = useAttachFile()

  const newEditorRef = React.useRef<EditorView>()
  const editorRef = providedEditorRef ?? newEditorRef
  const [editorHasFocus, setEditorHasFocus] = React.useState(false)

  const handleStateChange = React.useCallback((event: ViewUpdate) => {
    setEditorHasFocus(event.view.hasFocus)
  }, [])

  const handlePaste = React.useCallback(
    (event: ClipboardEvent, view: EditorView) => {
      const [file] = Array.from(event.clipboardData?.files ?? [])

      if (file) {
        attachFile(file, view)
        event.preventDefault()
      }
    },
    [attachFile],
  )

  function setValue(newValue: string) {
    const value = editorRef.current?.state.doc.toString() ?? ""
    editorRef.current?.dispatch({
      changes: [{ from: 0, to: value.length, insert: newValue }],
    })
  }

  function handleSubmit() {
    const value = editorRef.current?.state.doc.toString() ?? ""

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
      focusVisible={editorHasFocus}
      className="relative flex flex-col"
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
              editorRef={editorRef}
              defaultValue={defaultValue}
              placeholder={placeholder}
              className="flex flex-shrink-0 flex-grow p-4 pb-1"
              onStateChange={handleStateChange}
              onPaste={handlePaste}
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

function useAttachFile() {
  const getGitHubToken = useAtomCallback(React.useCallback((get) => get(githubTokenAtom), []))
  const getGitHubRepo = useAtomCallback(React.useCallback((get) => get(githubRepoAtom), []))

  const attachFile = React.useCallback(
    async (file: File, view?: EditorView) => {
      const githubToken = getGitHubToken()
      const githubRepo = getGitHubRepo()

      // We can't upload a file if we don't know where to upload it to
      // or if we don't have a reference to the CodeMirror view
      if (!githubRepo || !view) return

      try {
        const fileId = Date.now().toString()
        const fileExtension = file.name.split(".").pop()
        const fileName = file.name.replace(`.${fileExtension}`, "")
        const filePath = `/${UPLOADS_DIRECTORY}/${fileId}.${fileExtension}`
        const arrayBuffer = await file.arrayBuffer()

        // Upload file
        writeFile({ githubToken, githubRepo, path: filePath, content: arrayBuffer })

        // Cache file
        fileCache.set(filePath, { file, url: URL.createObjectURL(file) })

        // Get current selection
        const { selection } = view.state
        const { from = 0, to = 0 } = selection.ranges[selection.mainIndex] ?? {}
        const selectedText = view.state.doc.sliceString(from, to)

        // Compose markdown
        let markdown = `[${selectedText || fileName}](${filePath})`

        // Use markdown image syntax if file is an image, video, or audio
        if (
          file.type.startsWith("image/") ||
          file.type.startsWith("video/") ||
          file.type.startsWith("audio/")
        ) {
          markdown = `!${markdown}`
        }

        // Prepare next selection
        let anchor: number | undefined
        let head: number | undefined

        if (selectedText) {
          // If there is a selection, move the cursor to the end of the inserted markdown
          anchor = from + markdown.length
        } else {
          // Otherwise, select the text content of the inserted markdown so it's easy to change
          anchor = from + markdown.indexOf("]")
          head = from + markdown.indexOf("[") + 1
        }

        view?.dispatch({
          // Replace the current selection with the markdown
          changes: [{ from, to, insert: markdown }],
          selection: { anchor, head },
        })

        view.focus()
      } catch (error) {
        console.error(error)
      }
    },
    [getGitHubRepo, getGitHubToken],
  )

  return attachFile
}
