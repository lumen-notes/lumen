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
import { useAtomCallback } from "jotai/utils"
import * as emoji from "node-emoji"
import React from "react"
import { tagsAtom, templatesAtom } from "../global-atoms"
import { formatDate, formatDateDistance } from "../utils/date"
import { useUpsertNote } from "../utils/github-sync"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { removeParentTags } from "../utils/remove-parent-tags"
import { useAttachFile } from "../utils/use-attach-file"
import { useStableSearchNotes } from "../utils/use-search"
import { useInsertTemplate } from "./insert-template"

type NoteEditorProps = {
  className?: string
  defaultValue?: string
  placeholder?: string
  editorRef?: React.MutableRefObject<EditorView | undefined>
  onStateChange?: (event: ViewUpdate) => void
  onPaste?: (event: ClipboardEvent, view: EditorView) => void
}

export function NoteEditor({
  className,
  defaultValue = "",
  placeholder = "Write a note…",
  editorRef,
  onStateChange,
  onPaste,
}: NoteEditorProps) {
  const { containerRef } = useCodeMirror({
    defaultValue,
    placeholder,
    editorRef,
    onStateChange,
    onPaste,
  })

  return <div ref={containerRef} className={className} />
}

// TODO: Use @uiw/react-codemirror
// Reference: https://www.codiga.io/blog/implement-codemirror-6-in-react/
function useCodeMirror({
  defaultValue,
  placeholder: placeholderValue = "",
  editorRef: providedEditorRef,
  onStateChange,
  onPaste,
}: {
  defaultValue?: string
  placeholder?: string
  editorRef?: React.MutableRefObject<EditorView | undefined>
  onStateChange?: (event: ViewUpdate) => void
  onPaste?: (event: ClipboardEvent, view: EditorView) => void
}) {
  const [editorElement, setEditorElement] = React.useState<HTMLElement>()
  const containerRef = React.useCallback((node: HTMLElement | null) => {
    if (!node) return
    setEditorElement(node)
  }, [])
  const newEditorRef = React.useRef<EditorView>()
  const editorRef = providedEditorRef ?? newEditorRef
  const attachFile = useAttachFile()

  // Completions
  const noteCompletion = useNoteCompletion()
  const tagSyntaxCompletion = useTagSyntaxCompletion() // #tag
  const tagPropertyCompletion = useTagPropertyCompletion() // tags: [tag]
  const templateCompletion = useTemplateCompletion()

  React.useEffect(() => {
    if (!editorElement) return

    const state = EditorState.create({
      doc: defaultValue,
      extensions: [
        placeholder(placeholderValue),
        history(),
        EditorView.updateListener.of((event) => {
          // const value = event.view.state.doc.sliceString(0)
          // setValue(value)
          onStateChange?.(event)
        }),
        EditorView.contentAttributes.of({ spellcheck: "true", autocorrect: "on" }),
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

            // If the clipboard contains a file, upload it
            const [file] = Array.from(event.clipboardData?.files ?? [])

            if (file) {
              attachFile(file, view)
              event.preventDefault()
            }

            onPaste?.(event, view)
          },
          keydown: (event) => {
            // Don't propagate Escape and Enter keydown events to the parent element if autocomplete is open
            if (
              (event.key === "Escape" || event.key === "Enter") &&
              !event.metaKey &&
              document.querySelector(".cm-tooltip-autocomplete")
            ) {
              event.stopImmediatePropagation()
            }
          },
        }),
        closeBrackets(),
        autocompletion({
          override: [
            emojiCompletion,
            dateCompletion,
            noteCompletion,
            tagSyntaxCompletion,
            tagPropertyCompletion,
            templateCompletion,
          ],
          icons: false,
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorElement,
    })

    editorRef.current = view

    return () => {
      view.destroy()
    }
  }, [
    editorElement,
    // defaultValue,
    placeholderValue,
    onStateChange,
    onPaste,
    editorRef,
    // TODO: Prevent noteCompletion and tagCompletion from being recreated when state changes
    // noteCompletion,
    // tagCompletion,
    // templateCompletion,
  ])

  return { containerRef }
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

/**
 * Autocomplete tags when the user types "#"
 * @example #tag
 */
function useTagSyntaxCompletion() {
  const getTags = useAtomCallback(React.useCallback((get) => get(tagsAtom), []))

  const tagCompletion = React.useCallback(
    async (context: CompletionContext): Promise<CompletionResult | null> => {
      const word = context.matchBefore(/#[\w\-_\d/]*/)

      if (!word) {
        return null
      }

      const tags = Object.entries(getTags())
        // Sort tags by frequency
        .sort((a, b) => b[1].length - a[1].length)
        .map(([name]) => name)

      return {
        from: word.from + 1,
        options: tags
          .filter((tag) => tag.includes(word.text.slice(1)))
          .slice(0, 10)
          .map((name) => ({ label: name })),
        filter: false,
      }
    },
    [getTags],
  )

  return tagCompletion
}

/**
 * Autocomplete tags when using the `tags` property
 * @example tags: [tag]
 */
function useTagPropertyCompletion() {
  const getTags = useAtomCallback(React.useCallback((get) => get(tagsAtom), []))

  const tagCompletion = React.useCallback(
    async (context: CompletionContext): Promise<CompletionResult | null> => {
      const word = context.matchBefore(/tags: +\[[\w-/, ]*/)
      const lastTagMatch = word?.text.match(/[\w-/]+$/)

      if (!word) {
        return null
      }

      const tags = Object.entries(getTags())
        // Sort tags by frequency
        .sort((a, b) => b[1].length - a[1].length)
        .map(([name]) => name)

      return {
        from: word.from + (lastTagMatch?.index ?? word.text.length),
        options: tags
          .filter((tag) => tag.includes(lastTagMatch?.[0] ?? ""))
          .slice(0, 10)
          .map((name) => ({ label: name })),
        filter: false,
      }
    },
    [getTags],
  )

  return tagCompletion
}

function useNoteCompletion() {
  const upsertNote = useUpsertNote()
  const searchNotes = useStableSearchNotes()

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

      const options = searchResults.slice(0, 5).map((note): Completion => {
        const { content } = parseFrontmatter(note?.rawBody || "")
        return {
          label: note?.title || note.id,
          detail: removeParentTags(note.tags)
            .map((tag) => `#${tag}`)
            .join(" "),
          info: content,
          apply: (view, completion, from, to) => {
            // Insert link to note
            const text = `[[${note.id}${note?.title ? `|${note.title}` : ""}]]`

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

function useTemplateCompletion() {
  const getTemplates = useAtomCallback(React.useCallback((get) => get(templatesAtom), []))
  const insertTemplate = useInsertTemplate()

  const tagCompletion = React.useCallback(
    async (context: CompletionContext): Promise<CompletionResult | null> => {
      const query = context.matchBefore(/\/.*/)

      if (!query) {
        return null
      }

      const templates = Object.values(getTemplates())

      return {
        from: query.from + 1,
        options: templates.map((template) => ({
          label: template.name,
          apply: (view, completion, from, to) => {
            // Remove "/<query>" from editor
            view.dispatch({
              changes: { from: from - 1, to, insert: "" },
            })

            insertTemplate(template, view)
          },
        })),
      }
    },
    [getTemplates, insertTemplate],
  )

  return tagCompletion
}

function emojiCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/(^:\w*|\s:\w*)/)

  if (!word) {
    return null
  }

  // ":<query>" -> "<query>"
  const query = word.text.replace(/^(\s*)?:/, "")

  const results = emoji.search(query)

  const start = word.from + word.text.indexOf(":")

  return {
    from: start,
    options: results.slice(0, 10).map((result) => ({
      label: `${result.emoji} ${result.name}`,
      apply: result.emoji,
    })),
    filter: false,
  }
}
