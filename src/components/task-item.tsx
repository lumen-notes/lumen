import { addDays, format, isWeekend, nextMonday, nextSaturday } from "date-fns"
import { useCallback, useMemo, useRef, useState } from "react"
import { useNoteById } from "../hooks/note"
import type { NoteId, Task } from "../schema"
import { cx } from "../utils/cx"
import { toDateString } from "../utils/date"
import { removeDateFromTaskText } from "../utils/task"
import { Checkbox } from "./checkbox"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import {
  CalendarDateIcon16,
  CircleSlashIcon16,
  FlagFillIcon16,
  MoreIcon16,
  TrashIcon16,
} from "./icons"
import { Markdown } from "./markdown"
import { NoteEditor } from "./note-editor"
import { NoteLink } from "./note-link"

type TaskItemProps = {
  task: Task
  noteId: NoteId
  hideDate?: string
  className?: string
  onCompletedChange: (completed: boolean) => void
  onTextChange?: (text: string) => void
  onSchedule?: (date: string | null) => void
  onPriorityChange?: (priority: 1 | 2 | 3 | null) => void
  onDelete?: () => void
}

export function TaskItem({
  task,
  noteId,
  hideDate,
  className,
  onCompletedChange,
  onTextChange,
  onSchedule,
  onPriorityChange,
  onDelete,
}: TaskItemProps) {
  const note = useNoteById(noteId)
  const noteLabel = note?.displayName ?? noteId
  const shouldHideDate = hideDate !== undefined && hideDate === task.date
  const displayText = useMemo(
    () => (shouldHideDate ? removeDateFromTaskText(task.text, task.date) : task.text),
    [shouldHideDate, task.text, task.date],
  )
  const [mode, setMode] = useState<"read" | "write">("read")
  const [pendingText, setPendingText] = useState(task.text)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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
      // Only trigger write mode if clicking within this component
      if (!event.currentTarget.contains(target)) {
        return
      }
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

  const handleEscape = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        commitChange()
        setMode("read")
        setTimeout(() => buttonRef.current?.focus())
      }
    },
    [commitChange],
  )

  const handleEnter = useCallback(() => {
    commitChange()
    setMode("read")
    setTimeout(() => buttonRef.current?.focus())
    return true
  }, [commitChange])

  return (
    <div
      role="button"
      ref={buttonRef}
      className={cx(
        "flex rounded-lg gap-1 p-1 cursor-text focus-ring @container",
        mode === "read" && "hover:bg-bg-hover",
        mode === "write" && "ring-2 ring-inset ring-border-focus",
        isMenuOpen && "bg-bg-hover",
        className,
      )}
      tabIndex={0}
      onMouseDown={stopPropagationOnDoubleClick}
      onKeyDown={mode === "read" ? handleButtonKeyDown : undefined}
      onClick={mode === "read" ? handleButtonClick : undefined}
    >
      <div className="size-8 coarse:size-10 grid place-items-center shrink-0">
        <Checkbox
          key={String(task.completed)}
          defaultChecked={task.completed}
          onCheckedChange={(checked) => onCompletedChange?.(checked === true)}
        />
      </div>
      <div className="grid w-full @md:gap-3 @md:grid-cols-[1fr_auto] py-0.5 coarse:py-1.5">
        {mode === "read" ? (
          <div className="flex-1 min-w-0 ">
            <Markdown emptyText="Empty task">{displayText}</Markdown>
          </div>
        ) : (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          <div className="flex-1 min-w-0" onBlur={handleBlur} onKeyDown={handleEscape}>
            <NoteEditor
              defaultValue={pendingText}
              placeholder=""
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={true}
              indentWithTab={false}
              onChange={setPendingText}
              onEnter={handleEnter}
            />
          </div>
        )}
        {mode === "read" ? (
          <div className="@md:h-7 h-6 flex items-center text-text-secondary truncate">
            <NoteLink
              id={noteId}
              text={noteLabel}
              className="link truncate @md:max-w-52"
              hoverCardAlign="end"
            />
          </div>
        ) : null}
      </div>
      {mode === "read" ? (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
          <DropdownMenu.Trigger
            render={
              <IconButton aria-label="More actions" disableTooltip className="ml-1">
                <MoreIcon16 />
              </IconButton>
            }
          />
          <DropdownMenu.Content align="end" width={280}>
            <DropdownMenu.Group>
              <DropdownMenu.GroupLabel>Schedule</DropdownMenu.GroupLabel>
              {(() => {
                const today = new Date()
                return task.date !== toDateString(today) ? (
                  <DropdownMenu.Item
                    icon={<CalendarDateIcon16 date={today.getDate()} />}
                    onClick={() => onSchedule?.(toDateString(today))}
                    trailingVisual={
                      <span className="text-text-secondary">{format(today, "EEE")}</span>
                    }
                  >
                    Today
                  </DropdownMenu.Item>
                ) : null
              })()}
              {(() => {
                const tomorrow = addDays(new Date(), 1)
                return task.date !== toDateString(tomorrow) ? (
                  <DropdownMenu.Item
                    icon={<CalendarDateIcon16 date={tomorrow.getDate()} />}
                    onClick={() => onSchedule?.(toDateString(tomorrow))}
                    trailingVisual={
                      <span className="text-text-secondary">{format(tomorrow, "EEE")}</span>
                    }
                  >
                    Tomorrow
                  </DropdownMenu.Item>
                ) : null
              })()}
              {(() => {
                const now = new Date()
                const weekendDate = nextSaturday(now)
                const label = isWeekend(now) ? "Next weekend" : "This weekend"
                return task.date !== toDateString(weekendDate) ? (
                  <DropdownMenu.Item
                    icon={<CalendarDateIcon16 date={weekendDate.getDate()} />}
                    onClick={() => onSchedule?.(toDateString(weekendDate))}
                    trailingVisual={
                      <span className="text-text-secondary">
                        {format(weekendDate, "EEE MMM d")}
                      </span>
                    }
                  >
                    {label}
                  </DropdownMenu.Item>
                ) : null
              })()}
              {(() => {
                const mondayDate = nextMonday(new Date())
                return task.date !== toDateString(mondayDate) ? (
                  <DropdownMenu.Item
                    icon={<CalendarDateIcon16 date={mondayDate.getDate()} />}
                    onClick={() => onSchedule?.(toDateString(mondayDate))}
                    trailingVisual={
                      <span className="text-text-secondary">{format(mondayDate, "EEE MMM d")}</span>
                    }
                  >
                    Next week
                  </DropdownMenu.Item>
                ) : null
              })()}
              {task.date !== null ? (
                <DropdownMenu.Item icon={<CircleSlashIcon16 />} onClick={() => onSchedule?.(null)}>
                  No date
                </DropdownMenu.Item>
              ) : null}
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              <DropdownMenu.GroupLabel>Priority</DropdownMenu.GroupLabel>
              <DropdownMenu.Item
                icon={<FlagFillIcon16 className="text-[var(--red-9)] eink:text-text" />}
                selected={task.priority === 1}
                onClick={() => onPriorityChange?.(1)}
              >
                High
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<FlagFillIcon16 className="text-[var(--orange-9)] eink:text-text" />}
                selected={task.priority === 2}
                onClick={() => onPriorityChange?.(2)}
              >
                Medium
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<FlagFillIcon16 className="text-[var(--blue-9)] eink:text-text" />}
                selected={task.priority === 3}
                onClick={() => onPriorityChange?.(3)}
              >
                Low
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<CircleSlashIcon16 />}
                selected={task.priority === null}
                onClick={() => onPriorityChange?.(null)}
              >
                No priority
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item variant="danger" icon={<TrashIcon16 />} onClick={onDelete}>
              Delete task
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
