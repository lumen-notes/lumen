import { useAtomValue, useSetAtom } from "jotai"
import React from "react"
import { canUndoAtom, globalStateMachineAtom, lastUndoOperationAtom } from "../global-state"
import { UndoableOperation } from "../schema"
import { toast } from "../components/toast"

/**
 * Returns a function to trigger undo and whether undo is available
 */
export function useUndo() {
  const send = useSetAtom(globalStateMachineAtom)
  const canUndo = useAtomValue(canUndoAtom)
  const lastOperation = useAtomValue(lastUndoOperationAtom)

  const undo = React.useCallback(() => {
    if (!canUndo) return false
    send({ type: "UNDO" })
    return true
  }, [canUndo, send])

  return { undo, canUndo, lastOperation }
}

/**
 * Gets a human-readable description of an undo operation
 */
export function getUndoDescription(operation: UndoableOperation): string {
  switch (operation.type) {
    case "DELETE_NOTE":
      return `Restored "${operation.noteTitle}"`
    case "MOVE_TASK":
      return `Moved task back`
    case "REORDER_TASK":
      return `Reverted task order in "${operation.noteTitle}"`
  }
}

/**
 * Hook that registers the global Ctrl/Cmd+Z keyboard shortcut for undo
 * Should be used once at the app root level
 */
export function useUndoKeyboardShortcut() {
  const { undo, canUndo, lastOperation } = useUndo()

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      const isUndo = (event.metaKey || event.ctrlKey) && event.key === "z" && !event.shiftKey

      if (!isUndo || !canUndo) return

      // Don't intercept if focus is in an editable element (let CodeMirror handle its own undo)
      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.closest(".cm-editor")
      ) {
        return
      }

      event.preventDefault()

      if (undo() && lastOperation) {
        toast({ message: getUndoDescription(lastOperation) })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, canUndo, lastOperation])

  return { canUndo, lastOperation }
}
