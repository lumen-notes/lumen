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
import { vim } from "@replit/codemirror-vim"
import React from "react"
import { tagsAtom, templatesAtom } from "../global-state"
import { useAttachFile } from "../hooks/attach-file"
import { useSaveNote } from "../hooks/note"
import { useStableSearchNotes } from "../hooks/search"
import { formatDate, formatDateDistance, isValidUnixTimestamp } from "../utils/date"
import { getEditorSettings } from "../utils/editor-settings"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { removeParentTags } from "../utils/remove-parent-tags"
import { useInsertTemplate } from "./insert-template"

type NoteEditorProps = {
  className?: string
  defaultValue?: string
  placeholder?: string
  editorRef?: React.MutableRefObject<ReactCodeMirrorRef>
  autoFocus?: boolean
  onChange?: (value: string) => void
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
    gutterBackground: "transparent",
    gutterForeground: "var(--color-text-secondary)",
    gutterActiveForeground: "var(--color-text-secondary)",
    gutterBorder: "transparent",
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
      onChange,
      onStateChange,
      onPaste,
    },
    ref,
  ) => {
    const attachFile = useAttachFile()
    const [isTooltipOpen, setIsTooltipOpen] = React.useState(false)
    const editorSettings = getEditorSettings()

    // Completions
    const noteCompletion = useNoteCompletion()
    const tagSyntaxCompletion = useTagSyntaxCompletion() // #tag
    const tagPropertyCompletion = useTagPropertyCompletion() // tags: [tag]
    const templateCompletion = useTemplateCompletion()

    const extensions = [
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
      frontmatterExtension(),
      spellcheckExtension(),
      pasteExtension({ attachFile, onPaste }),
    ]

    if (editorSettings.vimMode) {
      extensions.push(vim())
    }

    return (
      <CodeMirror
        ref={ref}
        className={className}
        placeholder={placeholder}
        value={defaultValue}
        theme={theme}
        basicSetup={{
          lineNumbers: editorSettings.lineNumbers,
          foldGutter: false,
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
        onChange={onChange}
        onKeyDownCapture={(event) => {
          // Command + Enter is reserved for submitting the form so we need to prevent the default behavior
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
          }

          setIsTooltipOpen(Boolean(document.querySelector(".cm-tooltip-autocomplete")))
        }}
        onKeyDown={(event) => {
          // Don't propagate Escape and Enter keydown events to the parent element if autocomplete is open
          if (
            (event.key === "Escape" || event.key === "Enter") &&
            !event.metaKey &&
            !event.ctrlKey &&
            isTooltipOpen
          ) {
            event.stopPropagation()
          }
        }}
        extensions={extensions}
      />
    )
  },
)

function frontmatterExtension() {
  return EditorView.inputHandler.of((view: EditorView, from: number, to: number, text: string) => {
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
  })
}

function spellcheckExtension() {
  return EditorView.contentAttributes.of({ spellcheck: "true" })
}

function pasteExtension({
  attachFile,
  onPaste,
}: {
  attachFile: ReturnType<typeof useAttachFile>
  onPaste: NoteEditorProps["onPaste"]
}) {
  return EditorView.domEventHandlers({
    paste: (event, view) => {
      const clipboardText = event.clipboardData?.getData("text/plain") ?? ""

      // If the clipboard text is a URL or a Unix timestamp (likely a note ID),
      // make the selected text a link to that URL or note
      const isUrl = /^https?:\/\//.test(clipboardText)
      const isUnixTimestamp = isValidUnixTimestamp(clipboardText)

      if (isUrl || isUnixTimestamp) {
        // Get the selected text
        const { selection } = view.state
        const { from = 0, to = 0 } = selection.ranges[selection.mainIndex] ?? {}
        const selectedText = view?.state.doc.sliceString(from, to) ?? ""

        if (selectedText) {
          const markdown = isUnixTimestamp
            ? `[[${clipboardText}|${selectedText}]]`
            : `[${selectedText}](${clipboardText})`

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
      }

      // If the clipboard contains a file, upload it
      const [file] = Array.from(event.clipboardData?.files ?? [])

      if (file) {
        attachFile(file, view)
        event.preventDefault()
      }

      onPaste?.(event, view)
    },
  })
}

function dateCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\[\[[^\]|^|]*/)

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
