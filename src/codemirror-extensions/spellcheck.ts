import { EditorView } from "@codemirror/view"

export function spellcheckExtension() {
  return EditorView.contentAttributes.of({ spellcheck: "true" })
}
