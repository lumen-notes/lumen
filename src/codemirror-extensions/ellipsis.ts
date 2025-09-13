import { EditorView } from "@codemirror/view"

/**
 * Replaces three consecutive dots with a single ellipsis character.
 */
export function ellipsisExtension() {
  return EditorView.inputHandler.of((view, from, to, text) => {
    // When typing a single '.' check if the previous two characters are '..'
    if (text === "." && from >= 2 && view.state.sliceDoc(from - 2, from) === "..") {
      view.dispatch({
        changes: { from: from - 2, to, insert: "…" },
        selection: { anchor: from - 1 },
      })
      return true
    }

    // When pasting or inserting three dots at once
    if (text === "...") {
      view.dispatch({
        changes: { from, to, insert: "…" },
        selection: { anchor: from + 1 },
      })
      return true
    }

    return false
  })
}
