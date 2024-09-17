import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { yamlFrontmatter } from "@codemirror/lang-yaml"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { EditorSelection } from "@codemirror/state"
import { EditorView, ViewUpdate } from "@codemirror/view"
import { createTheme } from "@uiw/codemirror-themes"
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { parseDate } from "chrono-node"
import { useAtomCallback } from "jotai/utils"
// import * as emoji from "node-emoji"
import { tags } from "@lezer/highlight"
import { vim } from "@replit/codemirror-vim"
import React from "react"
import { frontmatterExtension } from "../codemirror-extensions/frontmatter"
import { indentedLineWrapExtension } from "../codemirror-extensions/indented-line-wrap"
import { pasteExtension } from "../codemirror-extensions/paste"
import { spellcheckExtension } from "../codemirror-extensions/spellcheck"
import { wikilinkExtension } from "../codemirror-extensions/wikilink"
import { tagsAtom, templatesAtom } from "../global-state"
import { useAttachFile } from "../hooks/attach-file"
import { useSaveNote } from "../hooks/note"
import { useStableSearchNotes } from "../hooks/search"
import { formatDate, formatDateDistance } from "../utils/date"
import { getEditorSettings } from "../utils/editor-settings"
import { removeLeadingEmoji } from "../utils/emoji"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { removeParentTags } from "../utils/remove-parent-tags"
import { useInsertTemplate } from "./insert-template"
import { usePanelLinkClickHandler } from "./panels"

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

const syntaxHighlighter = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: "var(--font-size-xl)",
    fontWeight: 550,
  },
  {
    tag: tags.heading2,
    fontSize: "var(--font-size-lg)",
    fontWeight: 550,
  },
  {
    tag: [tags.heading3, tags.heading4, tags.heading5, tags.heading6],
    fontWeight: 550,
  },
  {
    tag: [tags.comment, tags.contentSeparator],
    color: "var(--color-text-secondary)",
  },
  {
    tag: tags.emphasis,
    fontStyle: "italic",
  },
  {
    tag: tags.strong,
    fontWeight: 650,
  },
  {
    tag: tags.strikethrough,
    textDecoration: "line-through",
  },
])

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
    const handleLinkClick = usePanelLinkClickHandler()

    // Completions
    const noteCompletion = useNoteCompletion()
    const tagSyntaxCompletion = useTagSyntaxCompletion() // #tag
    const tagPropertyCompletion = useTagPropertyCompletion() // tags: [tag]
    const templateCompletion = useTemplateCompletion()

    const extensions = React.useMemo(() => {
      const baseExtensions = [
        yamlFrontmatter({ content: markdown({ base: markdownLanguage }) }),
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
        indentedLineWrapExtension(),
        wikilinkExtension((to) => handleLinkClick({ to, target: "_blank" })),
        syntaxHighlighting(syntaxHighlighter),
      ]

      if (editorSettings.vimMode) {
        baseExtensions.push(vim())
      }

      return baseExtensions
    }, [
      attachFile,
      onPaste, // TODO
      editorSettings.vimMode, // TODO
      noteCompletion,
      tagPropertyCompletion,
      tagSyntaxCompletion,
      templateCompletion,
      handleLinkClick,
    ])

    return (
      <CodeMirror
        ref={ref}
        className={className}
        placeholder={placeholder}
        value={defaultValue}
        theme={theme}
        basicSetup={{
          lineNumbers: editorSettings.lineNumbers,
          foldGutter: editorSettings.foldGutter,
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
            const text = `[[${note.id}${
              note?.title ? `|${removeLeadingEmoji(note.title).trim()}` : ""
            }]]`

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
