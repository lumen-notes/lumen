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
import { parseDate } from "chrono-node"
import clsx from "clsx"
import React from "react"
import { NoteId } from "../types"
import { formatDate, formatDateDistance } from "../utils/date"
import { useAtomValue, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { githubRepoAtom, githubTokenAtom, tagsAtom, upsertNoteAtom } from "../global-atoms"
import { useUpsertNote } from "../utils/github-sync"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { useSearchNotes } from "../utils/use-search-notes"
import { Button } from "./button"
import { Card, CardProps } from "./card"
import { FileInputButton } from "./file-input-button"
import { fileCache } from "./file-preview"
import { IconButton } from "./icon-button"
import { PaperclipIcon16 } from "./icons"
import { writeFile } from "../utils/github-fs"

const UPLOADS_DIRECTORY = "uploads"

type NoteFormProps = {
  id?: NoteId
  defaultValue?: string
  placeholder?: string
  elevation?: CardProps["elevation"]
  minHeight?: string | number
  maxHeight?: string | number
  codeMirrorViewRef?: React.MutableRefObject<EditorView | undefined>
  onSubmit?: (note: { id: NoteId; rawBody: string }) => void
  onCancel?: () => void
}

export function NoteForm({
  id,
  defaultValue = "",
  placeholder = "Write a note…",
  elevation = 0,
  minHeight,
  maxHeight,
  codeMirrorViewRef,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const githubRepo = useAtomValue(githubRepoAtom)
  const upsertNote = useUpsertNote()
  const attachFile = useAttachFile()

  const [editorHasFocus, setEditorHasFocus] = React.useState(false)

  const handleStateChange = React.useCallback(
    (event: ViewUpdate) => setEditorHasFocus(event.view.hasFocus),
    [],
  )

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

  const {
    editorRef,
    view,
    value = "",
  } = useCodeMirror({
    defaultValue,
    placeholder,
    viewRef: codeMirrorViewRef,
    onStateChange: handleStateChange,
    onPaste: handlePaste,
  })

  function setValue(newValue: string) {
    view?.dispatch({
      changes: [{ from: 0, to: value.length, insert: newValue }],
    })
  }

  function handleSubmit() {
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
          attachFile(file, view)
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
            <div ref={editorRef} className="flex flex-shrink-0 flex-grow p-4 pb-1" />
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
                    attachFile(file, view)
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

// Reference: https://www.codiga.io/blog/implement-codemirror-6-in-react/
function useCodeMirror({
  defaultValue,
  placeholder: placeholderValue = "",
  viewRef: providedViewRef,
  onStateChange,
  onPaste,
}: {
  defaultValue?: string
  placeholder?: string
  viewRef?: React.MutableRefObject<EditorView | undefined>
  onStateChange?: (event: ViewUpdate) => void
  onPaste?: (event: ClipboardEvent, view: EditorView) => void
}) {
  const [editorElement, setEditorElement] = React.useState<HTMLElement>()
  const editorRef = React.useCallback((node: HTMLElement | null) => {
    if (!node) return
    setEditorElement(node)
  }, [])
  const newViewRef = React.useRef<EditorView>()
  const viewRef = providedViewRef ?? newViewRef

  const [value, setValue] = React.useState(defaultValue)

  // Completions
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
        EditorView.domEventHandlers({
          paste: (event, view) => {
            const clipboardText = event.clipboardData?.getData("text/plain") ?? ""
            const isUrl = /^https?:\/\//.test(clipboardText)

            // If the clipboard text is a URL, convert selected text into a markdown link
            if (isUrl) {
              const { selection } = view.state
              const { from = 0, to = 0 } = selection.ranges[selection.mainIndex] ?? {}
              const selectedText = view?.state.doc.sliceString(from, to) ?? ""
              const markdown = selectedText ? `[${selectedText}](${clipboardText})` : clipboardText

              view.dispatch({
                changes: {
                  from,
                  to,
                  insert: markdown,
                },
                selection: {
                  anchor: from + markdown.length,
                },
              })

              event.preventDefault()
            }

            onPaste?.(event, view)
          },
        }),
        closeBrackets(),
        autocompletion({
          override: [dateCompletion, noteCompletion, tagCompletion],
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
  }, [
    editorElement,
    defaultValue,
    placeholderValue,
    onStateChange,
    onPaste,
    viewRef,
    // TODO: Prevent noteCompletion and tagCompletion from being recreated when state changes
    // noteCompletion,
    // tagCompletion,
  ])

  return { editorRef, view: viewRef.current, value }
}

function dateCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/(\[\[[^\]|^|]*|\w*)/)

  if (!word) {
    return null
  }

  // "[[<query>" -> "<query>"
  const query = word.text.replace(/^\[\[/, "")

  if (!query) {
    return null
  }

  const date = parseDate(query)

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
        detail: formatDateDistance(dateString),
        apply: (view, completion, from, to) => {
          const text = `[[${dateString}]]`

          const hasClosingBrackets = view.state.sliceDoc(to, to + 2) === "]]"
          view.dispatch({
            changes: { from, to: hasClosingBrackets ? to + 2 : to, insert: text },
            selection: { anchor: from + text.length },
          })
        },
      },
    ],
    filter: false,
  }
}

function useTagCompletion() {
  const getTags = useAtomCallback(React.useCallback((get) => get(tagsAtom), []))

  const tagCompletion = React.useCallback(
    async (context: CompletionContext): Promise<CompletionResult | null> => {
      const word = context.matchBefore(/#[\w\-_\d/]*/)

      if (!word) {
        return null
      }

      const tags = Object.keys(getTags())

      return {
        from: word.from + 1,
        options: tags.map((name) => ({ label: name })),
      }
    },
    [getTags],
  )

  return tagCompletion
}

function useNoteCompletion() {
  const upsertNote = useSetAtom(upsertNoteAtom)
  const searchNotes = useSearchNotes()

  const noteCompletion = React.useCallback(
    async (context: CompletionContext): Promise<CompletionResult | null> => {
      const word = context.matchBefore(/\[\[[^\]|^|]*/)

      if (!word) {
        return null
      }

      // "[[<query>" -> "<query>"
      const query = word.text.slice(2)

      const searchResults = searchNotes(query)

      const createNewNoteOption: Completion = {
        label: `Create new note "${query}"`,
        apply: (view, completion, from, to) => {
          const note = {
            id: Date.now().toString(),
            rawBody: `# ${query}\n\n#inbox`,
          }

          upsertNote(note)

          // Insert link to new note
          const text = `[[${note.id}|${query}]]`

          const hasClosingBrackets = view.state.sliceDoc(to, to + 2) === "]]"
          view.dispatch({
            changes: { from, to: hasClosingBrackets ? to + 2 : to, insert: text },
            selection: { anchor: from + text.length },
          })
        },
      }

      const options = searchResults.slice(0, 5).map(([id, note]): Completion => {
        const { content } = parseFrontmatter(note?.rawBody || "")
        return {
          label: content || "",
          info: content,
          apply: (view, completion, from, to) => {
            // Insert link to note
            const text = `[[${id}${note?.title ? `|${note.title}` : ""}]]`

            const hasClosingBrackets = view.state.sliceDoc(to, to + 2) === "]]"
            view.dispatch({
              changes: { from, to: hasClosingBrackets ? to + 2 : to, insert: text },
              selection: { anchor: from + text.length },
            })
          },
        }
      })

      if (query) {
        options.push(createNewNoteOption)
      }

      return {
        from: word.from,
        options,
        filter: false,
      }
    },
    [searchNotes, upsertNote],
  )

  return noteCompletion
}
