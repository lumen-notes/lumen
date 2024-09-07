import { EditorState, Extension, Range, StateField } from "@codemirror/state"
import { Decoration, EditorView } from "@codemirror/view"

// Reference: https://discuss.codemirror.net/t/making-codemirror-6-respect-indent-for-wrapped-lines/2881/8

const indentedLineWrapField = StateField.define({
  create(state) {
    return getDecorations(state)
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return getDecorations(tr.state)
    }
    return decorations
  },
  provide: (f) => EditorView.decorations.from(f),
})

function getDecorations(state: EditorState) {
  const decorations: Range<Decoration>[] = []

  for (let i = 0; i < state.doc.lines; i++) {
    const line = state.doc.line(i + 1)

    // Check if the line starts with whitespace followed by a dash or asterisk and a space,
    // which indicates a list item in Markdown
    const isListItem = /^\s*[-*]\s/.test(line.text)

    if (!isListItem) continue

    // Count the number of leading spaces in the line
    const numLeadingSpaces = line.text.match(/^ */)?.[0]?.length ?? 0

    const lineDecoration = Decoration.line({
      attributes: {
        style: `--indent: ${numLeadingSpaces + 2}`, // Add 2 for the bullet point and space
        class: "cm-indentedLine",
      },
    })

    decorations.push(lineDecoration.range(line.from, line.from))
  }

  return Decoration.set(decorations)
}

export function indentedLineWrapExtension(): Extension {
  return indentedLineWrapField
}
