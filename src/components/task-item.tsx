import { EditorSelection } from "@codemirror/state"
import { EditorView, ViewUpdate } from "@codemirror/view"
import React from "react"
import { useLocation } from "react-router-dom"
import { Task } from "../types"
import { formatDateDistance } from "../utils/date"
import { useUpsertNote } from "../utils/github-sync"
import { removeParentTags } from "../utils/remove-parent-tags"
import { useNoteById } from "../utils/use-note-by-id"
import { Button } from "./button"
import { Card } from "./card"
import { Checkbox } from "./checkbox"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { EditIcon16, MoreIcon16, NoteIcon16, TrashIcon16 } from "./icons"
import { useLink } from "./link-context"
import { Markdown } from "./markdown"
import { NoteEditor } from "./note-editor"
import { PanelContext } from "./panels"
import { TagLink } from "./tag-link"

export function TaskItem({ task }: { task: Task }) {
  const note = useNoteById(task.noteId)
  const upsertNote = useUpsertNote()
  const Link = useLink()
  const location = useLocation()
  const panel = React.useContext(PanelContext)
  const inCalendarPanel = panel ? panel.pathname === "/calendar" : location.pathname === "/calendar"

  // Local state
  const [isEditing, setIsEditing] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  // Refs
  const containerRef = React.useRef<HTMLLIElement>(null)
  const editorRef = React.useRef<EditorView>()

  const switchToEditing = React.useCallback(() => {
    setIsEditing(true)
    // Wait for the editor to mount
    setTimeout(() => {
      const view = editorRef.current
      if (view) {
        // Focus the editor
        view.focus()
        // Move cursor to end of document
        view.dispatch({
          selection: EditorSelection.cursor(view.state.doc.sliceString(0).length),
        })
      }
    })
  }, [])

  const switchToViewing = React.useCallback(() => {
    setIsEditing(false)
    setTimeout(() => containerRef.current?.focus())
  }, [])

  if (isEditing) {
    return (
      <TaskItemForm
        task={task}
        editorRef={editorRef}
        onSubmit={switchToViewing}
        onCancel={switchToViewing}
      />
    )
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li
      ref={containerRef}
      // Used for focus management
      data-note-id={task.noteId}
      className="flex items-start rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-border-focus"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onKeyDown={(event) => {
        // Open dropdown with `command + .`
        if (event.key === "." && event.metaKey) {
          setIsDropdownOpen(true)
          event.preventDefault()
        }

        // Switch to editing with `e`
        if (event.key === "e") {
          switchToEditing()
          event.preventDefault()
        }
      }}
    >
      <div className="flex flex-grow items-start gap-3 px-3 py-[0.625rem] pr-0 coarse:px-4 coarse:py-3">
        <span className="grid h-5 place-items-center coarse:h-6">
          <Checkbox
            priority={task.priority}
            checked={task.completed}
            onCheckedChange={(checked) => {
              upsertNote({
                id: task.noteId,
                rawBody:
                  note.rawBody.slice(0, task.start?.offset) +
                  (checked ? "- [x]" : "- [ ]") +
                  note.rawBody.slice((task.start?.offset ?? 0) + 5),
              })
            }}
          />
        </span>
        <div className="flex-grow space-y-1 [&_*]:!leading-5 coarse:[&_*]:!leading-6">
          <Markdown>{task.title}</Markdown>
          <div className="space-x-2 text-text-secondary [&:empty]:hidden">
            {!inCalendarPanel && task.dates.length > 0 ? (
              <Link
                key={task.dates[0]}
                to={`/calendar?date=${task.dates[0]}`}
                target="_blank"
                className="link"
              >
                {formatDateDistance(task.dates[0])}
              </Link>
            ) : null}
            {!inCalendarPanel && task.dates.length > 0 && task.tags.length > 0 ? (
              <span>·</span>
            ) : null}
            {removeParentTags(task.tags).map((tag) => (
              <TagLink key={tag} name={tag} />
            ))}
          </div>
        </div>
      </div>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
        <DropdownMenu.Trigger asChild>
          <IconButton
            aria-label="Task actions"
            shortcut={["⌘", "."]}
            tooltipSide="top"
            className="m-1"
          >
            <MoreIcon16 />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item icon={<EditIcon16 />} shortcut={["E"]} onSelect={switchToEditing}>
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item icon={<NoteIcon16 />} shortcut={["G"]} disabled>
            Go to note
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item variant="danger" icon={<TrashIcon16 />} shortcut={["⌘", "⌫"]} disabled>
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </li>
  )
}

type TaskItemFormProps = {
  task: Task
  editorRef: React.MutableRefObject<EditorView | undefined>
  onSubmit?: (rawBody: string) => void
  onCancel?: () => void
}

function TaskItemForm({ task, editorRef, onSubmit, onCancel }: TaskItemFormProps) {
  const note = useNoteById(task.noteId)
  const upsertNote = useUpsertNote()
  const [editorHasFocus, setEditorHasFocus] = React.useState(false)

  const handleStateChange = React.useCallback((event: ViewUpdate) => {
    setEditorHasFocus(event.view.hasFocus)
  }, [])

  function handleSubmit() {
    const editorValue = editorRef.current?.state.doc.toString() ?? ""

    // Don't submit if the value is empty
    if (!editorValue) return

    const prevValue = `- [${task.completed ? "x" : " "}] ${task.rawBody}`
    const newValue = `- [${task.completed ? "x" : " "}] ${editorValue}`

    const rawBody =
      note.rawBody.slice(0, task.start.offset) +
      newValue +
      note.rawBody.slice((task.start.offset || 0) + prevValue.length)

    upsertNote({ id: note.id, rawBody })

    onSubmit?.(rawBody)
  }

  return (
    <Card focusVisible={editorHasFocus}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form
        onSubmit={(event) => {
          handleSubmit()
          event.preventDefault()
        }}
        onKeyDown={(event) => {
          // Submit on `enter` if no autocomplete menu is open
          if (event.key === "Enter") {
            handleSubmit()
            event.preventDefault()
          }
          // Cancel on `escape`
          if (event.key === "Escape") {
            onCancel?.()
            event.preventDefault()
          }
        }}
      >
        <NoteEditor
          className="px-3 pb-1 pt-[0.625rem] coarse:px-4 coarse:pt-3"
          defaultValue={task.rawBody}
          onStateChange={handleStateChange}
          editorRef={editorRef}
        />
        <div className="sticky bottom-0 flex justify-end rounded-lg bg-bg-backdrop p-2 backdrop-blur-md">
          <div className="flex gap-2">
            {onCancel ? (
              <Button shortcut={["esc"]} onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" variant="primary" shortcut={["⏎"]}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
