type Shortcut =
  | "next-panel"
  | "prev-panel"
  | "first-panel"
  | "last-panel"
  | "copy-note-id"
  | "copy-markdown"
  | undefined

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getShortcut = (event: any): Shortcut => {
  if (event.key === "ArrowLeft" && event.altKey && event.shiftKey) {
    return "first-panel"
  }

  if (event.key === "ArrowRight" && event.altKey && event.shiftKey) {
    return "last-panel"
  }

  if (event.key === "ArrowLeft" && event.altKey) {
    return "prev-panel"
  }

  if (event.key === "ArrowRight" && event.altKey) {
    return "next-panel"
  }

  if (event.metaKey && event.ctrlKey && event.key == "c") {
    return "copy-note-id"
  }

  if (event.metaKey && event.key == "c" && !window.getSelection()?.toString()) {
    return "copy-markdown"
  }
}
