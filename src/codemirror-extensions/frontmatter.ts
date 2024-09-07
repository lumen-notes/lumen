import { EditorView } from "@codemirror/view"

export function frontmatterExtension() {
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
