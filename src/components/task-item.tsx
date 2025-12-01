import { useCallback, useMemo, useRef, useState } from "react"
import { useNoteById } from "../hooks/note"
import type { NoteId, Task } from "../schema"
import { cx } from "../utils/cx"
import { removeDateFromTaskText } from "../utils/task"
import { Checkbox } from "./checkbox"
import { Markdown } from "./markdown"
import { NoteEditor } from "./note-editor"
import { NoteLink } from "./note-link"

type TaskItemProps = {
  task: Task
  parentId: NoteId
  hideDate?: boolean
  className?: string
  onCompletedChange: (completed: boolean) => void
  onTextChange?: (text: string) => void
}

export function TaskItem({
  task,
  parentId,
  hideDate = false,
  className,
  onCompletedChange,
  onTextChange,
}: TaskItemProps) {
  const parentNote = useNoteById(parentId)
  const parentLabel = parentNote?.displayName ?? parentId
  const displayText = useMemo(
    () => (hideDate ? removeDateFromTaskText(task.text, task.date) : task.text),
    [hideDate, task.text, task.date],
  )
  const [mode, setMode] = useState<"read" | "write">("read")
  const [pendingText, setPendingText] = useState(task.text)
  const buttonRef = useRef<HTMLDivElement>(null)

  const commitChange = useCallback(() => {
    if (onTextChange && pendingText !== task.text) {
      onTextChange(pendingText)
    }
  }, [onTextChange, pendingText, task.text])

  const stopPropagationOnDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.detail > 1) {
      event.stopPropagation()
    }
  }, [])

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const nextFocusTarget = event.relatedTarget as Node | null
      if (!event.currentTarget.contains(nextFocusTarget)) {
        commitChange()
        setTimeout(() => setMode("read"))
      }
    },
    [commitChange],
  )

  const handleButtonClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null
      if (
        target?.closest(
          "a,button,input,textarea,select,summary,[contenteditable='true'],[contenteditable='']",
        )
      ) {
        return
      }
      setPendingText(task.text)
      setMode("write")
    },
    [task.text],
  )

  const handleButtonKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return
      if (event.target !== event.currentTarget) return
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        setPendingText(task.text)
        setMode("write")
      }
    },
    [task.text],
  )

  const handleEditorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault()
        event.stopPropagation()
        commitChange()
        setMode("read")
        setTimeout(() => buttonRef.current?.focus())
      }
    },
    [commitChange],
  )

  return (
    <div
      role="button"
      ref={buttonRef}
      className={cx(
        "flex rounded-lg py-1.5 coarse:py-2.5 gap-3 px-3 coarse:px-[14px] coarse:gap-[14px] cursor-text focus-ring @container",
        mode === "read" && "hover:bg-bg-hover",
        mode === "write" && "ring-2 ring-inset ring-border-focus",
        className,
      )}
      tabIndex={0}
      onMouseDown={stopPropagationOnDoubleClick}
      onKeyDown={mode === "read" ? handleButtonKeyDown : undefined}
      onClick={mode === "read" ? handleButtonClick : undefined}
    >
      <div className="h-7 flex items-center">
        <Checkbox
          key={String(task.completed)}
          defaultChecked={task.completed}
          onCheckedChange={(checked) => onCompletedChange?.(checked === true)}
        />
      </div>
      <div className="flex w-full @md:gap-3 flex-col @md:flex-row">
        {mode === "read" ? (
          <div className="flex-1 min-w-0">
            <Markdown emptyText="Empty task">{displayText}</Markdown>
          </div>
        ) : (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          <div className="flex-1 min-w-0" onBlur={handleBlur} onKeyDown={handleEditorKeyDown}>
            <NoteEditor
              defaultValue={pendingText}
              placeholder=""
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={true}
              indentWithTab={false}
              onChange={(text) => setPendingText(text)}
            />
          </div>
        )}
        {mode === "read" ? (
          <div className="@md:h-7 h-6 flex items-center text-text-secondary whitespace-nowrap">
            <NoteLink id={parentId} text={parentLabel} className="link" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
