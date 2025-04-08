import { EditorState, Extension, Line, Range, StateField, Transaction } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView } from "@codemirror/view"

const headingField = StateField.define({
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
 * Updates the decorations for markdown headings when the document changes.
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

/** Returns a line decoration for markdown headings. */
function getLineDecoration(line: Line) {
  // Match markdown heading syntax: between 1-6 hash symbols (#) at start of line, followed by a space
  // Examples: "# Heading 1", "## Heading 2", "### Heading 3", etc.
  const headingMatch = line.text.match(/^(#{1,6})\s/)

  if (headingMatch) {
    const [_, hashes] = headingMatch
    const level = hashes.length

    let fontSize = ""
    if (level === 1) {
      fontSize = "var(--font-size-xl)"
    } else if (level === 2) {
      fontSize = "var(--font-size-lg)"
    }

    return Decoration.line({
      attributes: {
        style: `font-weight: var(--font-weight-bold);${fontSize ? ` font-size: ${fontSize};` : ""}`,
      },
    })
  }

  return null
}

export function headingExtension(): Extension {
  return headingField
}
