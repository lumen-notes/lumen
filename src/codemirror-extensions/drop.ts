import { EditorView } from "@codemirror/view"

export function fileFromDrop(event: {
  dataTransfer: DataTransfer | null
  preventDefault: () => void
  stopPropagation: () => void
}) {
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return null
  const file = files[0]
  event.preventDefault()
  event.stopPropagation()
  return file
}

export function dropExtension({
  attachFile,
}: {
  attachFile: (
    file: File,
    view: EditorView,
    coords: { x: number; y: number },
  ) => void | Promise<unknown>
}) {
  return EditorView.domEventHandlers({
    drop(event, view) {
      const file = fileFromDrop(event)
      if (!file) return false
      void attachFile(file, view, { x: event.clientX, y: event.clientY })
      return true
    },
  })
}
