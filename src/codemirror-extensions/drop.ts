import { EditorView } from "@codemirror/view"

export function dropExtension(_options: {
  attachFile: (
    file: File,
    view: EditorView,
    coords: { x: number; y: number },
  ) => void | Promise<unknown>
}) {
  return EditorView.domEventHandlers({
    drop() {
      return false
    },
  })
}
