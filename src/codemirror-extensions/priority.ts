import { EditorState, Extension, Range, StateField, Transaction } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView } from "@codemirror/view"

const priorityStyles: Record<1 | 2 | 3, string> = {
  1: "color: var(--red-a12); background-color: var(--red-a4); border-radius: var(--border-radius-sm); padding: 0 2px;",
  2: "color: var(--orange-a12); background-color: var(--orange-a4); border-radius: var(--border-radius-sm); padding: 0 2px;",
  3: "color: var(--blue-a12); background-color: var(--blue-a4); border-radius: var(--border-radius-sm); padding: 0 2px;",
}

const priorityField = StateField.define({
  create(state) {
    return createDecorations(state)
  },
  update(decorations, transaction) {
    if (transaction.docChanged) {
      return updateDecorations(decorations, transaction)
    }
    return decorations
  },
  provide: (f) => EditorView.decorations.from(f),
})

function createDecorations(state: EditorState): DecorationSet {
  const decorations: Range<Decoration>[] = []
  const text = state.doc.toString()
  const regex = /!!([123])/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const level = parseInt(match[1]) as 1 | 2 | 3
    const from = match.index
    const to = from + match[0].length

    decorations.push(
      Decoration.mark({
        attributes: { style: priorityStyles[level] },
      }).range(from, to),
    )
  }

  return Decoration.set(decorations)
}

function updateDecorations(oldDecorations: DecorationSet, tr: Transaction): DecorationSet {
  // For simplicity, recreate all decorations on change
  // This is efficient enough for priority markers which are sparse
  return createDecorations(tr.state)
}

export function priorityExtension(): Extension {
  return priorityField
}
