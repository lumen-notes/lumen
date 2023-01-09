import {
  autocompletion,
  closeBrackets,
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete"
import { history } from "@codemirror/commands"
import { EditorState } from "@codemirror/state"
import { EditorView, placeholder, ViewUpdate } from "@codemirror/view"
import { useActor } from "@xstate/react"
import { Buffer } from "buffer"
import { parseDate } from "chrono-node"
import clsx from "clsx"
import { Searcher } from "fast-fuzzy"
import React from "react"
import { GlobalStateContext } from "../global-state"
import { NoteId } from "../types"
import { formatDate } from "../utils/date"
import { Button, IconButton } from "./button"
import { Card, CardProps } from "./card"
import { FileInputButton } from "./file-input-button"
import { fileCache } from "./file-preview"
import { PaperclipIcon16 } from "./icons"

const UPLOADS_DIRECTORY = "uploads"

type NoteFormProps = {
  id?: NoteId
  defaultBody?: string
  elevation?: CardProps["elevation"]
  minHeight?: string | number
  maxHeight?: string | number
  codeMirrorViewRef?: React.MutableRefObject<EditorView | undefined>
  onSubmit?: (note: { id: NoteId; body: string }) => void
  onCancel?: () => void
}

export function NoteForm({
  id,
  defaultBody = "",
  elevation = 0,
  minHeight,
  maxHeight,
  codeMirrorViewRef,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  const [editorHasFocus, setEditorHasFocus] = React.useState(false)

  const {
    editorRef,
    view,
    value: body = "",
  } = useCodeMirror({
    defaultValue: defaultBody,
    placeholder: "Write a note...",
    viewRef: codeMirrorViewRef,
    onStateChange: (event) => setEditorHasFocus(event.view.hasFocus),
  })

  function setBody(value: string) {
    view?.dispatch({
      changes: [{ from: 0, to: body.length, insert: value }],
    })
  }

  function handleSubmit() {
    // Don't create empty notes
    if (!body) return

    const note = {
      id: id ?? Date.now().toString(),
      body: body,
    }

    globalState.service?.send({
      type: "UPSERT_NOTE",
      ...note,
    })

    onSubmit?.(note)

    // If we're creating a new note, reset the form after submitting
    if (!id) {
      setBody(defaultBody)
    }
  }

  async function attachFile(file: File) {
    try {
      const fileId = Date.now().toString()
      const fileExtension = file.name.split(".").pop()
      const fileName = file.name.replace(`.${fileExtension}`, "")
      const filePath = `/${UPLOADS_DIRECTORY}/${fileId}.${fileExtension}`
      const arrayBuffer = await file.arrayBuffer()

      // Upload file
      fetch(
        `https://api.github.com/repos/${state.context.repoOwner}/${state.context.repoName}/contents${filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${state.context.authToken}`,
          },
          body: JSON.stringify({
            message: `Upload ${fileId}.${fileExtension}`,
            content: Buffer.from(arrayBuffer).toString("base64"),
          }),
        },
      )

      // Cache file
      fileCache.set(filePath, { file, url: URL.createObjectURL(file) })

      let markdown = `[${fileName}](${filePath})`

      // Use markdown image syntax if file is an image, video, or audio
      if (
        file.type.startsWith("image/") ||
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/")
      ) {
        markdown = `!${markdown}`
      }

      const { from = 0, to = 0 } =
        view?.state.selection.ranges[view?.state.selection.mainIndex] || {}
      const anchor = from + markdown.indexOf("]")
      const head = from + markdown.indexOf("[") + 1

      view?.dispatch({
        // Replace the current selection with the markdown
        changes: [{ from, to, insert: markdown }],
        // Select the text content of the inserted markdown
        selection: { anchor, head },
      })

      view?.focus()
    } catch (error) {
      console.error(error)
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
          attachFile(file)
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
          className={clsx("flex flex-col", maxHeight !== undefined && "overflow-auto")}
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
                setBody("")
                onCancel?.()
              }
            }}
          >
            <div
              ref={editorRef}
              className="grid flex-shrink-0 flex-grow p-4 pb-1"
              onPaste={(event) => {
                const [file] = Array.from(event.clipboardData.files)

                if (file) {
                  attachFile(file)
                  event.preventDefault()
                }
              }}
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
                    attachFile(file)
                  }
                }}
              >
                <IconButton aria-label="Attach file">
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

// Reference: https://www.codiga.io/blog/implement-codemirror-6-in-react/
function useCodeMirror({
  defaultValue,
  placeholder: placeholderValue = "",
  viewRef: providedViewRef,
  onStateChange,
}: {
  defaultValue?: string
  placeholder?: string
  viewRef?: React.MutableRefObject<EditorView | undefined>
  onStateChange?: (event: ViewUpdate) => void
}) {
  const [editorElement, setEditorElement] = React.useState<HTMLElement>()
  const editorRef = React.useCallback((node: HTMLElement | null) => {
    if (!node) return

    setEditorElement(node)
  }, [])

  const newViewRef = React.useRef<EditorView>()
  const viewRef = providedViewRef ?? newViewRef

  const [value, setValue] = React.useState(defaultValue)

  const noteCompletion = useNoteCompletion()
  const tagCompletion = useTagCompletion()

  React.useEffect(() => {
    if (!editorElement) return

    const state = EditorState.create({
      doc: defaultValue,
      extensions: [
        placeholder(placeholderValue),
        history(),
        EditorView.updateListener.of((event) => {
          const value = event.view.state.doc.sliceString(0)
          setValue(value)
          onStateChange?.(event)
        }),
        closeBrackets(),
        autocompletion({
          override: [noteCompletion, dateCompletion, tagCompletion],
          icons: false,
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorElement,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [editorElement])

  return { editorRef, view: viewRef.current, value }
}

function dateCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/(\[\[)?\w*/)

  if (!word) {
    return null
  }

  // Ignore words inside internal links
  if (word.text.startsWith("[[")) {
    return null
  }

  const date = parseDate(word.text)

  if (!date) {
    return null
  }

  const year = String(date.getFullYear()).padStart(4, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const dateString = `${year}-${month}-${day}`

  return {
    from: word.from,
    options: [
      {
        label: formatDate(dateString),
        apply: `[[${dateString}]]`,
      },
    ],
    filter: false,
  }
}

function useTagCompletion() {
  const globalState = React.useContext(GlobalStateContext)

  const tagCompletion = React.useCallback(
    async (context: CompletionContext): Promise<CompletionResult | null> => {
      const word = context.matchBefore(/#[\w\-_\d]*/)

      if (!word) {
        return null
      }

      const tags = Object.keys(globalState.service.getSnapshot().context.tags)

      return {
        from: word.from + 1,
        options: tags.map((name) => ({ label: name })),
      }
    },
    [globalState],
  )

  return tagCompletion
}

function useNoteCompletion() {
  const globalState = React.useContext(GlobalStateContext)

  const noteCompletion = React.useCallback(
    async (context: CompletionContext): Promise<CompletionResult | null> => {
      const word = context.matchBefore(/\[\[[^\]|^|]*/)

      if (!word) {
        return null
      }

      // "[[<query>" -> "<query>"
      const query = word.text.slice(2)

      if (!query) {
        return null
      }

      const entries = Object.entries(globalState.service.getSnapshot().context.notes)

      // Create a search index
      const searcher = new Searcher(entries, {
        keySelector: ([id, { body }]) => body,
        threshold: 0.8,
      })

      const results = searcher.search(query)

      const createNewNoteOption: Completion = {
        label: `Create new note "${query}"`,
        apply: (view, completion, from, to) => {
          const note = {
            id: Date.now().toString(),
            body: `${query}\n\n#inbox`,
          }

          // Create new note
          globalState.service.send({
            type: "UPSERT_NOTE",
            ...note,
          })

          // Insert link to new note
          const text = `${note.id}|${query}`
          const anchor = from + text.length
          const head = anchor - query.length

          view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor, head },
          })
        },
      }

      const options = [
        ...results.slice(0, 6).map(
          ([id, { body }]): Completion => ({
            label: body,
            info: body,
            apply: (view, completion, from, to) => {
              // Insert link to note
              const text = `${id}|${query}`
              const anchor = from + text.length
              const head = anchor - query.length

              view.dispatch({
                changes: { from, to, insert: text },
                selection: { anchor, head },
              })
            },
          }),
        ),
        createNewNoteOption,
      ]

      return {
        from: word.from + 2, // Insert after "[["
        options,
        filter: false,
      }
    },
    [globalState],
  )

  return noteCompletion
}
