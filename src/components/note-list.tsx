import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { useInView } from "react-intersection-observer"
import { useLocation } from "react-router-dom"
import { z } from "zod"
import { notesAtom } from "../global-atoms"
import { NoteId, Task, templateSchema } from "../types"
import { formatDateDistance } from "../utils/date"
import { useUpsertNote } from "../utils/github-sync"
import { pluralize } from "../utils/pluralize"
import { removeParentTags } from "../utils/remove-parent-tags"
import { parseQuery, useSearchNotes, useSearchTasks } from "../utils/use-search"
import { useSearchParam } from "../utils/use-search-param"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import {
  CardsIcon16,
  CloseIcon12,
  EditIcon16,
  ListIcon16,
  MoreIcon16,
  NoteIcon16,
  TagIcon16,
  TaskListIcon16,
  TrashIcon16,
} from "./icons"
import { useLink } from "./link-context"
import { Markdown } from "./markdown"
import { NoteCard } from "./note-card"
import { NoteFavicon } from "./note-favicon"
import { PanelContext } from "./panels"
import { PillButton } from "./pill-button"
import { SearchInput } from "./search-input"
import { TagLink } from "./tag-link"

const viewTypeSchema = z.enum(["list", "cards", "tasks"])

type ViewType = z.infer<typeof viewTypeSchema>

type NoteListProps = {
  baseQuery?: string
}

export function NoteList({ baseQuery = "" }: NoteListProps) {
  const searchNotes = useSearchNotes()
  const searchTasks = useSearchTasks()
  const Link = useLink()

  const parseQueryParam = React.useCallback((value: unknown): string => {
    return typeof value === "string" ? value : ""
  }, [])

  const [query, setQuery] = useSearchParam("q", {
    defaultValue: "",
    schema: z.string(),
    parse: parseQueryParam,
    replace: true,
  })

  const deferredQuery = React.useDeferredValue(query)

  const noteResults = React.useMemo(() => {
    return searchNotes(`${baseQuery} ${deferredQuery}`)
  }, [searchNotes, baseQuery, deferredQuery])

  const taskResults = React.useMemo(() => {
    return (
      searchTasks(`${baseQuery} ${deferredQuery}`)
        // Sort by priority
        .sort((a, b) => a.priority - b.priority)
    )
  }, [searchTasks, baseQuery, deferredQuery])

  const parseViewType = React.useCallback((value: unknown): ViewType => {
    switch (value) {
      case "list":
        return "list"
      case "tasks":
        return "tasks"
      default:
        return "cards"
    }
  }, [])

  const [viewType, setViewType] = useSearchParam<ViewType>("v", {
    defaultValue: "cards",
    schema: viewTypeSchema,
    parse: parseViewType,
    replace: true,
  })

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10)

  const [bottomRef, bottomInView] = useInView()

  const loadMore = React.useCallback(() => {
    setNumVisibleNotes((num) => Math.min(num + 10, noteResults.length))
  }, [noteResults.length])

  React.useEffect(() => {
    if (bottomInView) {
      // Load more notes when the user scrolls to the bottom of the list
      loadMore()
    }
  }, [bottomInView, loadMore])

  const numVisibleTags = 4

  const sortedTagFrequencies = React.useMemo(() => {
    const frequencyMap = new Map<string, number>()

    const tags =
      viewType === "tasks"
        ? taskResults.flatMap((task) => task.tags)
        : noteResults.flatMap((note) => note.tags)

    for (const tag of tags) {
      frequencyMap.set(tag, (frequencyMap.get(tag) ?? 0) + 1)
    }

    const frequencyEntries = [...frequencyMap.entries()]

    return (
      frequencyEntries
        // Filter out tags that every note has
        .filter(
          ([, frequency]) =>
            frequency < (viewType === "tasks" ? taskResults.length : noteResults.length),
        )
        // Filter out parent tags if the all the childs tag has the same frequency
        .filter(([tag, frequency]) => {
          const childTags = frequencyEntries.filter(
            ([otherTag]) => otherTag !== tag && otherTag.startsWith(tag),
          )

          if (childTags.length === 0) return true

          return !childTags.every(([, otherFrequency]) => otherFrequency === frequency)
        })
        .sort((a, b) => {
          // Put p1, p2, p3, etc. tags at the start
          if (a[0].startsWith("p") && !b[0].startsWith("p")) return -1
          if (!a[0].startsWith("p") && b[0].startsWith("p")) return 1
          if (a[0].startsWith("p") && b[0].startsWith("p")) return a[0].localeCompare(b[0])

          return b[1] - a[1]
        })
    )
  }, [viewType, taskResults, noteResults])

  const tagQualifiers = React.useMemo(() => {
    return parseQuery(deferredQuery).qualifiers.filter((qualifier) => qualifier.key === "tag")
  }, [deferredQuery])

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <SearchInput
              placeholder={
                viewType === "tasks"
                  ? `Search ${pluralize(taskResults.length, "task")}…`
                  : `Search ${pluralize(noteResults.length, "note")}…`
              }
              value={query}
              onChange={(value) => {
                setQuery(value)

                // Reset the number of visible notes when the user starts typing
                setNumVisibleNotes(10)
              }}
            />
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton
                  disableTooltip
                  aria-label="Change view"
                  className="h-11 w-11 rounded-md bg-bg-secondary hover:bg-bg-tertiary coarse:h-12 coarse:w-12"
                >
                  <ViewTypeIcon viewType={viewType} />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" minWidth="8rem">
                <DropdownMenu.Item
                  icon={<CardsIcon16 />}
                  selected={viewType === "cards"}
                  onClick={() => setViewType("cards")}
                >
                  Cards
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<ListIcon16 />}
                  selected={viewType === "list"}
                  onClick={() => setViewType("list")}
                >
                  List
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<TaskListIcon16 />}
                  selected={viewType === "tasks"}
                  onClick={() => setViewType("tasks")}
                >
                  Tasks
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
          {deferredQuery ? (
            <span className="text-sm text-text-secondary">
              {pluralize(noteResults.length, "result")}
            </span>
          ) : null}
        </div>

        {sortedTagFrequencies.length > 0 || tagQualifiers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tagQualifiers.map((qualifier) => (
              <PillButton
                key={qualifier.values.join(",")}
                variant="primary"
                onClick={() => {
                  const text = `${qualifier.exclude ? "-" : ""}tag:${qualifier.values.join(",")}`

                  const index = query.indexOf(text)

                  if (index === -1) return

                  const newQuery =
                    query.slice(0, index) + query.slice(index + text.length).trimStart()

                  // Remove the tag qualifier from the query
                  setQuery(newQuery.trim())
                }}
              >
                {qualifier.exclude ? <span className="italic">not</span> : null}
                {qualifier.values.map((value, index) => (
                  <React.Fragment key={value}>
                    {index > 0 ? <span className="italic">or</span> : null}
                    <span key={value}>{value}</span>
                  </React.Fragment>
                ))}
                <CloseIcon12 className="-mr-0.5" />
              </PillButton>
            ))}
            {sortedTagFrequencies.slice(0, numVisibleTags).map(([tag, frequency]) => (
              <PillButton
                key={tag}
                onClick={(event) => {
                  const qualifier = `${event.shiftKey ? "-" : ""}tag:${tag}`
                  setQuery(query ? `${query} ${qualifier}` : qualifier)
                }}
              >
                {tag}
                <span className="text-text-secondary">{frequency}</span>
              </PillButton>
            ))}
            {sortedTagFrequencies.length > numVisibleTags ? (
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <PillButton variant="dashed">Show more</PillButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  {sortedTagFrequencies.slice(numVisibleTags).map(([tag, frequency]) => (
                    <DropdownMenu.Item
                      key={tag}
                      icon={<TagIcon16 />}
                      trailingVisual={<span className="text-text-secondary">{frequency}</span>}
                      onClick={(event) => {
                        const qualifier = `${event.shiftKey ? "-" : ""}tag:${tag}`
                        setQuery(query ? `${query} ${qualifier}` : qualifier)
                      }}
                    >
                      {tag}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}

        {viewType === "cards"
          ? noteResults.slice(0, numVisibleNotes).map(({ id }) => <NoteCard key={id} id={id} />)
          : null}

        {viewType === "list" ? (
          <ul>
            {noteResults.slice(0, numVisibleNotes).map((note) => {
              const parsedTemplate = templateSchema
                .omit({ body: true })
                .safeParse(note.frontmatter.template)
              return (
                // TODO: Move this into a NoteItem component
                <li key={note.id}>
                  <Link
                    // Used for focus management
                    data-note-id={note.id}
                    to={`/${note.id}`}
                    target="_blank"
                    className="focus-ring flex gap-3 rounded-md p-3 leading-4 hover:bg-bg-secondary coarse:p-4"
                  >
                    <NoteFavicon note={note} />
                    <span className="truncate text-text-secondary">
                      <span className="text-text">
                        {parsedTemplate.success
                          ? `${parsedTemplate.data.name} template`
                          : note.title || note.id}
                      </span>
                      <span className="ml-2 ">
                        {removeParentTags(note.tags)
                          .map((tag) => `#${tag}`)
                          .join(" ")}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : null}

        {viewType === "tasks" ? (
          <ul className="flex flex-col">
            {taskResults.map((task) => (
              <TaskItem key={`${task.noteId}-${task.start.offset}`} task={task} />
            ))}
          </ul>
        ) : null}
      </div>

      {viewType !== "tasks" && noteResults.length > numVisibleNotes ? (
        <Button ref={bottomRef} className="mt-4 w-full" onClick={loadMore}>
          Load more
        </Button>
      ) : null}
    </div>
  )
}

function ViewTypeIcon({ viewType }: { viewType: ViewType }) {
  switch (viewType) {
    case "cards":
      return <CardsIcon16 />
    case "list":
      return <ListIcon16 />
    case "tasks":
      return <TaskListIcon16 />
  }
}

// TODO: Move this to the utils directory
function useNoteById(id: NoteId) {
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes[id]), [id])
  const note = useAtomValue(noteAtom)
  return note
}

function TaskItem({ task }: { task: Task }) {
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
