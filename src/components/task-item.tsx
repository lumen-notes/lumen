import { Checkbox } from "./checkbox"
import { DropdownMenu } from "./dropdown-menu"
import React from "react"
import { useLocation } from "react-router-dom"
import { Task } from "../types"
import { formatDateDistance } from "../utils/date"
import { useUpsertNote } from "../utils/github-sync"
import { removeParentTags } from "../utils/remove-parent-tags"
import { IconButton } from "./icon-button"
import { MoreIcon16, EditIcon16, NoteIcon16, TrashIcon16 } from "./icons"
import { useLink } from "./link-context"
import { Markdown } from "./markdown"
import { PanelContext } from "./panels"
import { TagLink } from "./tag-link"
import { useNoteById } from "../utils/use-note-by-id"

export function TaskItem({ task }: { task: Task }) {
  const note = useNoteById(task.noteId)
  const upsertNote = useUpsertNote()
  const Link = useLink()
  const location = useLocation()
  const panel = React.useContext(PanelContext)

  const inCalendarPanel = panel ? panel.pathname === "/calendar" : location.pathname === "/calendar"

  // Local state
  // const [isEditing, setIsEditing] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li
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
          <DropdownMenu.Item icon={<EditIcon16 />} shortcut={["E"]} disabled>
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item icon={<NoteIcon16 />} shortcut={["N"]} disabled>
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
