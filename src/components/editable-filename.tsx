import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { TextInput } from "./text-input"
import { Tooltip } from "./tooltip"
import { Keys } from "./keys"
import { cx } from "../utils/cx"

type EditableFilenameProps = {
  noteId: string
  isSignedOut: boolean
  onRename: (newName: string) => boolean | Promise<boolean>
}

export interface EditableFilenameHandle {
  startRename: () => void
}

export const EditableFilename = forwardRef<EditableFilenameHandle, EditableFilenameProps>(
  ({ noteId, isSignedOut, onRename }, ref) => {
    const [isRenaming, setIsRenaming] = useState(false)
    const [renameValue, setRenameValue] = useState(noteId)
    const inputRef = useRef<HTMLInputElement>(null)

    // Sync internal state with noteId prop
    useEffect(() => {
      setRenameValue(noteId)
      setIsRenaming(false)
    }, [noteId])

    const startRename = useCallback(() => {
      if (isSignedOut || isRenaming) return
      setIsRenaming(true)
      // Focus and select the text for immediate editing
      requestAnimationFrame(() => inputRef.current?.select())
    }, [isSignedOut, isRenaming])

    // Expose startRename to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        startRename,
      }),
      [startRename],
    )

    // Global F2 Shortcut logic
    useHotkeys(
      "f2",
      (e) => {
        e.preventDefault()
        startRename()
      },
      { enabled: !isSignedOut && !isRenaming },
    )

    const handleFinish = async () => {
      const trimmed = renameValue.trim()
      // If empty or unchanged, just close
      if (!trimmed || trimmed === noteId) {
        setIsRenaming(false)
        setRenameValue(noteId)
        return
      }

      const success = await onRename(trimmed)
      if (success) {
        setIsRenaming(false)
      } else {
        // Keep input open and focus if rename failed (e.g. duplicate name)
        inputRef.current?.focus()
      }
    }

    const handleCancel = () => {
      setRenameValue(noteId)
      setIsRenaming(false)
    }

    if (isRenaming) {
      return (
        <div className="flex w-full max-w-full items-center gap-1">
          <TextInput
            ref={inputRef}
            aria-label="Edit filename"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleFinish}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleFinish()
              }
              if (e.key === "Escape") {
                e.preventDefault()
                handleCancel()
              }
            }}
            className="h-7 min-w-0 flex-grow text-sm font-bold sm:max-w-[300px]"
          />
          <span className="shrink-0 select-none text-text-secondary">.md</span>
        </div>
      )
    }

    return (
      <Tooltip>
        <Tooltip.Trigger
          render={
            <button
              type="button"
              disabled={isSignedOut}
              aria-label={`Rename note: ${noteId}`}
              className={cx(
                "truncate text-left font-bold transition-colors outline-none",
                !isSignedOut &&
                  "cursor-text hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -mx-1",
                "focus-visible:ring-2 focus-visible:ring-blue-500",
              )}
              onDoubleClick={(e) => {
                e.preventDefault()
                startRename()
              }}
              onTouchStart={(e) => {
                // Standard mobile double-tap detection
                if (e.detail === 2) {
                  e.preventDefault()
                  startRename()
                }
              }}
              onKeyDown={(e) => {
                // Allow keyboard activation via Enter or Space
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  startRename()
                }
              }}
            >
              {noteId}
              <span className="opacity-50">.md</span>
            </button>
          }
        />
        {!isSignedOut && (
          <Tooltip.Content side="bottom" align="start">
            <div className="flex items-center gap-1.5">
              <span>Rename file</span>
              <div className="flex text-text-secondary coarse:hidden">
                <Keys keys={["F2"]} />
              </div>
            </div>
          </Tooltip.Content>
        )}
      </Tooltip>
    )
  },
)

EditableFilename.displayName = "EditableFilename"
