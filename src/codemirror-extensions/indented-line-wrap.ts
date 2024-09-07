import { EditorState, Extension, Line, Range, StateField, Transaction } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView } from "@codemirror/view"

// Reference: https://discuss.codemirror.net/t/making-codemirror-6-respect-indent-for-wrapped-lines/2881/8

const indentedLineWrapField = StateField.define({
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

function createDecorations(state: EditorState) {
  const decorations: Range<Decoration>[] = []

  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i)
    const lineDecoration = getLineDecoration(line)

    if (lineDecoration) {
      decorations.push(lineDecoration.range(line.from))
    }
  }

  return Decoration.set(decorations)
}

/**
 * Updates the decorations for indented line wrapping when the document changes.
 * This method is more efficient than recreating all decorations for several reasons:
 * 1. It only processes the changed ranges of the document, not all lines.
 * 2. It reuses existing decorations that weren't affected by the changes.
 * 3. It's optimized for changes, using the Transaction object to map positions and identify changed ranges.
 * 4. It reduces overall processing, especially for large documents with small changes.
 */
function updateDecorations(oldDecorations: DecorationSet, tr: Transaction): DecorationSet {
  const decorations: Range<Decoration>[] = []

  // Iterate through existing decorations and update their positions
  oldDecorations.between(0, tr.newDoc.length, (from, to, decoration) => {
    const newFrom = tr.changes.mapPos(from)
    const newTo = tr.changes.mapPos(to)
    if (tr.changes.touchesRange(from, to)) {
      // If the range was affected by the changes, recalculate the decoration
      const line = tr.newDoc.lineAt(newFrom)
      const newDecoration = getLineDecoration(line)
      if (newDecoration) {
        decorations.push(newDecoration.range(newFrom, newTo))
      }
    } else {
      // If the range wasn't affected, keep the existing decoration
      decorations.push(decoration.range(newFrom, newTo))
    }
  })

  // Process newly changed ranges
  tr.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
    let posB = fromB
    while (posB <= toB) {
      // For each line in the changed range, check if it needs a decoration
      const line = tr.newDoc.lineAt(posB)
      const decoration = getLineDecoration(line)
      if (decoration) {
        decorations.push(decoration.range(line.from))
      }
      posB = line.to + 1
    }
  })

  // Sort decorations by 'from' position
  decorations.sort((a, b) => a.from - b.from)

  // Return the sorted decorations as a DecorationSet
  return Decoration.set(decorations)
}

/** Returns a line decoration for indented line wrapping. */
function getLineDecoration(line: Line) {
  const isListItem = /^\s*[-*]\s/.test(line.text)

  if (!isListItem) return null

  const numLeadingSpaces = line.text.match(/^ */)?.[0]?.length ?? 0
  const indent = numLeadingSpaces + 2 // Add 2 for the bullet point and space

  return Decoration.line({
    attributes: {
      style: `margin-left: ${indent}ch; text-indent: -${indent}ch;`,
    },
  })
}

export function indentedLineWrapExtension(): Extension {
  return indentedLineWrapField
}
