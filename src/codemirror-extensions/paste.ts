import { EditorView } from "@codemirror/view"
import { useAttachFile } from "../hooks/attach-file"
import { isValidUnixTimestamp } from "../utils/date"

export function pasteExtension({
  attachFile,
  onPaste,
}: {
  attachFile: ReturnType<typeof useAttachFile>
  onPaste?: (event: ClipboardEvent, view: EditorView) => void
}) {
  return EditorView.domEventHandlers({
    paste: (event, view) => {
      const clipboardText = event.clipboardData?.getData("text/plain") ?? ""

      // If the clipboard text is a URL or a Unix timestamp (likely a note ID),
      // make the selected text a link to that URL or note
      const isUrl = /^https?:\/\//.test(clipboardText)
      const isUnixTimestamp = isValidUnixTimestamp(clipboardText)

      if (isUrl || isUnixTimestamp) {
        // Get the selected text
        const { selection } = view.state
        const { from = 0, to = 0 } = selection.ranges[selection.mainIndex] ?? {}
        const selectedText = view?.state.doc.sliceString(from, to) ?? ""

        if (selectedText) {
          const markdown = isUnixTimestamp
            ? `[[${clipboardText}|${selectedText}]]`
            : `[${selectedText}](${clipboardText})`

          view.dispatch({
            changes: {
              from,
              to,
              insert: markdown,
            },
            selection: {
              anchor: from + markdown.length,
            },
          })

          event.preventDefault()
        }
      }

      // If the clipboard contains a file, upload it
      const [file] = Array.from(event.clipboardData?.files ?? [])

      if (file) {
        attachFile(file, view)
        event.preventDefault()
      }

      onPaste?.(event, view)
    },
  })
}
