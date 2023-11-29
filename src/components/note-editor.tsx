import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { EditorSelection } from "@codemirror/state"
import { EditorView, ViewUpdate } from "@codemirror/view"
import { createTheme } from "@uiw/codemirror-themes"
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { parseDate } from "chrono-node"
import { useAtomCallback } from "jotai/utils"
// import * as emoji from "node-emoji"
import React from "react"
import { getVimModeFromLocalStorage, tagsAtom, templatesAtom } from "../global-state"
import { formatDate, formatDateDistance } from "../utils/date"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { removeParentTags } from "../utils/remove-parent-tags"
import { useAttachFile } from "../utils/use-attach-file"
import { useSaveNote } from "../utils/use-save-note"
import { useStableSearchNotes } from "../utils/use-search"
import { useInsertTemplate } from "./insert-template"
import { vim } from "@replit/codemirror-vim"

type NoteEditorProps = {
  className?: string
  defaultValue?: string
  placeholder?: string
  editorRef?: React.MutableRefObject<ReactCodeMirrorRef>
  autoFocus?: boolean
  onStateChange?: (event: ViewUpdate) => void
  onPaste?: (event: ClipboardEvent, view: EditorView) => void
}

const theme = createTheme({
  theme: "light",
  settings: {
    background: "transparent",
    lineHighlight: "transparent",
    foreground: "var(--color-text)",
    caret: "var(--color-border-focus)",
    selection: "var(--color-bg-selection)",
  },
  styles: [],
})

export const NoteEditor = React.forwardRef<ReactCodeMirrorRef, NoteEditorProps>(
  (
    {
      className,
      defaultValue = "",
      placeholder = "Write a note…",
      autoFocus = false,
      onStateChange,
      onPaste,
    },
    ref,
  ) => {
    const attachFile = useAttachFile()

    // Completions
    const noteCompletion = useNoteCompletion()
    const tagSyntaxCompletion = useTagSyntaxCompletion() // #tag
    const tagPropertyCompletion = useTagPropertyCompletion() // tags: [tag]
    const templateCompletion = useTemplateCompletion()

    const [isTooltipOpen, setIsTooltipOpen] = React.useState(false)
    const [vimMode, setVimMode] = React.useState(false)

    React.useEffect(() => {
      const isVimModeEnabled = getVimModeFromLocalStorage()
      setVimMode(isVimModeEnabled)
    }, [vimMode])


    const extenstions = [
      markdown({ base: markdownLanguage }),
      autocompletion({
        override: [
          // emojiCompletion,
          dateCompletion,
          noteCompletion,
          tagSyntaxCompletion,
          tagPropertyCompletion,
          templateCompletion,
        ],
        icons: false,
      }),
      EditorView.inputHandler.of((view: EditorView, from: number, to: number, text: string) => {
        // If you're inserting a `-` at index 2 and all previous characters are also `-`,
        // insert a matching `---` below the line
        if (
          (text === "-" && from === 2 && view.state.sliceDoc(0, 2) === "--") ||
          // Sometimes the mobile Safari replaces `--` with `—` so we need to handle that case too
          (text === "-" && from === 1 && view.state.sliceDoc(0, 1) === "—")
        ) {
          view.dispatch({
            changes: {
              from: 0,
              to,
              insert: "---\n\n---",
            },
            selection: {
              anchor: 4,
            },
          })

          return true
        }

        return false
      }),
      EditorView.contentAttributes.of({ spellcheck: "true" }),
      EditorView.domEventHandlers({
        paste: (event, view) => {
          const clipboardText = event.clipboardData?.getData("text/plain") ?? ""
          const isUrl = /^https?:\/\//.test(clipboardText)

          // If the clipboard text is a URL, convert selected text into a markdown link
          if (isUrl) {
            const { selection } = view.state
            const { from = 0, to = 0 } = selection.ranges[selection.mainIndex] ?? {}
            const selectedText = view?.state.doc.sliceString(from, to) ?? ""
            const markdown = selectedText
              ? `[${selectedText}](${clipboardText})`
              : clipboardText

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
      }),
    ]

    return (
      <CodeMirror
        ref={ref}
        className={className}
        placeholder={placeholder}
        value={defaultValue}
        theme={theme}
        basicSetup={{
          lineNumbers: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          bracketMatching: false,
        }}
        onCreateEditor={(view) => {
          if (autoFocus) {
            // Focus the editor
            view.focus()
            // Move cursor to end of document
            view.dispatch({
              selection: EditorSelection.cursor(view.state.doc.sliceString(0).length),
            })
          }
        }}
        onUpdate={onStateChange}
        onKeyDownCapture={(event) => {
          // Command + Enter is reserved for submitting the form so we need to prevent the default behavior
          if (event.key === "Enter" && event.metaKey) {
            event.preventDefault()
          }

          setIsTooltipOpen(Boolean(document.querySelector(".cm-tooltip-autocomplete")))
        }}
        onKeyDown={(event) => {
          // Don't propagate Escape and Enter keydown events to the parent element if autocomplete is open
          if (
            (event.key === "Escape" || event.key === "Enter") &&
            !event.metaKey &&
            isTooltipOpen
          ) {
            event.stopPropagation()
          }
        }}
        extensions={vimMode ? [...extenstions, vim()] : extenstions}
      />
    )
  },
)

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
  const saveNote = useSaveNote()
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
            content: `# ${query}`,
          }

          saveNote(note)

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
        const { content } = parseFrontmatter(note?.content || "")

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
    [searchNotes, saveNote],
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

// function emojiCompletion(context: CompletionContext): CompletionResult | null {
//   const word = context.matchBefore(/(^:\w*|\s:\w*)/)

//   if (!word) {
//     return null
//   }

//   // ":<query>" -> "<query>"
//   const query = word.text.replace(/^(\s*)?:/, "")

//   const results = emoji.search(query)

//   const start = word.from + word.text.indexOf(":")

//   return {
//     from: start,
//     options: results.slice(0, 10).map((result) => ({
//       label: `${result.emoji} ${result.name}`,
//       apply: result.emoji,
//     })),
//     filter: false,
//   }
// }
