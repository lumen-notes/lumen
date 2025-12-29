import { motion } from "motion/react"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"
import { useDebounce } from "use-debounce"
import { useSearchTasks } from "../hooks/search-tasks"
import { parseQuery } from "../utils/search"
import { formatNumber, pluralize } from "../utils/pluralize"
import { Button } from "./button"
import { DropdownMenu } from "./dropdown-menu"
import { TagFillIcon12, TagIcon12, TagIcon16, XIcon12 } from "./icons"
import { LinkHighlightProvider } from "./link-highlight-provider"
import { PillButton } from "./pill-button"
import { SearchInput } from "./search-input"
import { TaskItem } from "./task-item"
import {
  deleteTask,
  prioritizeTask,
  scheduleTask,
  updateTaskCompletion,
  updateTaskText,
} from "../utils/task"
import { useSaveNote } from "../hooks/note"

type TaskListProps = {
  baseQuery?: string
  defaultSort?: string
  query: string
  onQueryChange: (query: string) => void
}

const initialVisibleItems = 10

export function TaskList({
  baseQuery = "",
  defaultSort = "completed,date,priority",
  query,
  onQueryChange,
}: TaskListProps) {
  const searchTasks = useSearchTasks()
  const saveNote = useSaveNote()

  // Task item animation
  const [shouldAnimateTasks, setShouldAnimateTasks] = useState(false)
  const animationTimeoutRef = useRef<number>()
  const enableTaskAnimation = useCallback(() => {
    setShouldAnimateTasks(true)
    clearTimeout(animationTimeoutRef.current)
    animationTimeoutRef.current = window.setTimeout(() => {
      setShouldAnimateTasks(false)
    }, 400)
  }, [])
  useEffect(() => {
    return () => clearTimeout(animationTimeoutRef.current)
  }, [])

  const [deferredQuery] = useDebounce(query, 150)

  const taskResults = useMemo(() => {
    return searchTasks(`${baseQuery} ${deferredQuery} sort:${defaultSort}`)
  }, [searchTasks, baseQuery, deferredQuery, defaultSort])

  const [numVisibleItems, setNumVisibleItems] = useState(initialVisibleItems)

  const [bottomRef, bottomInView] = useInView()

  const loadMore = React.useCallback(() => {
    setNumVisibleItems((num) => Math.min(num + 10, taskResults.length))
  }, [taskResults.length])

  React.useEffect(() => {
    if (bottomInView) {
      loadMore()
    }
  }, [bottomInView, loadMore])

  const numVisibleTags = 4

  const sortedTagFrequencies = React.useMemo(() => {
    const frequencyMap = new Map<string, number>()

    const tags = taskResults.flatMap((result) => result.tags)

    for (const tag of tags) {
      frequencyMap.set(tag, (frequencyMap.get(tag) ?? 0) + 1)
    }

    const frequencyEntries = [...frequencyMap.entries()]

    return (
      frequencyEntries
        // Filter out tags that every task has
        .filter(([, frequency]) => frequency < taskResults.length)
        // Filter out parent tags if all child tags have the same frequency
        .filter(([tag, frequency]) => {
          const childTags = frequencyEntries.filter(
            ([otherTag]) => otherTag !== tag && otherTag.startsWith(tag),
          )

          if (childTags.length === 0) return true

          return !childTags.every(([, otherFrequency]) => otherFrequency === frequency)
        })
        .sort((a, b) => {
          return b[1] - a[1]
        })
    )
  }, [taskResults])

  const filters = React.useMemo(() => {
    return parseQuery(query).filters
  }, [query])

  const tagFilters = React.useMemo(() => {
    return filters.filter((filter) => filter.key === "tag")
  }, [filters])

  const highlightPaths = React.useMemo(() => {
    return filters
      .filter((filter) => !filter.exclude)
      .flatMap((filter) => {
        switch (filter.key) {
          case "tag":
            // Tag links now use search query params instead of /tags/ routes
            // Include paths for each segment of the tag (e.g., tag:foo/bar highlights both foo and foo/bar)
            return filter.values.flatMap((value) => {
              const segments = value.split("/")
              return segments.map((_, i) => {
                const tagPath = segments.slice(0, i + 1).join("/")
                return `/?query=tag%3A${encodeURIComponent(tagPath)}&view=grid`
              })
            })
          case "link":
            return filter.values.map((value) => `/${value}`)
          case "date":
            return filter.values.map((value) => `/${value}`)
          default:
            return []
        }
      })
  }, [filters])

  return (
    <LinkHighlightProvider href={highlightPaths}>
      <div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <SearchInput
              placeholder={`Search ${pluralize(taskResults.length, "task")}…`}
              value={query}
              autoCapitalize="off"
              spellCheck="false"
              onChange={(value) => {
                onQueryChange(value)
                setNumVisibleItems(initialVisibleItems)
              }}
            />
          </div>
          {sortedTagFrequencies.length > 0 || tagFilters.length > 0 || deferredQuery ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 empty:hidden">
                {sortedTagFrequencies.length > 0 || tagFilters.length > 0 ? (
                  <>
                    {tagFilters.map((filter) => (
                      <PillButton
                        key={filter.values.join(",")}
                        data-tag={filter.values.join(",")}
                        variant="primary"
                        onClick={() => {
                          const text = `${filter.exclude ? "-" : ""}tag:${filter.values.join(",")}`

                          const index = query.indexOf(text)

                          if (index === -1) return

                          const newQuery =
                            query.slice(0, index) + query.slice(index + text.length).trimStart()

                          onQueryChange(newQuery.trim())
                        }}
                      >
                        <TagFillIcon12 />
                        {filter.exclude ? <span className="italic">not</span> : null}
                        {filter.values.map((value, index) => (
                          <React.Fragment key={value}>
                            {index > 0 ? <span>or</span> : null}
                            <span key={value}>{value}</span>
                          </React.Fragment>
                        ))}
                        <XIcon12 className="-mr-0.5" />
                      </PillButton>
                    ))}
                    {sortedTagFrequencies.slice(0, numVisibleTags).map(([tag, frequency]) => (
                      <PillButton
                        key={tag}
                        data-tag={tag}
                        onClick={(event) => {
                          const qualifier = `${event.shiftKey ? "-" : ""}tag:${tag}`

                          onQueryChange(query ? `${query} ${qualifier}` : qualifier)

                          setTimeout(() => {
                            document.querySelector<HTMLElement>(`[data-tag="${tag}"]`)?.focus()
                          })
                        }}
                      >
                        <TagIcon12 className="text-text-secondary" />
                        {tag}
                        <span className="text-text-secondary">{formatNumber(frequency)}</span>
                      </PillButton>
                    ))}
                    {sortedTagFrequencies.length > numVisibleTags ? (
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <PillButton variant="dashed" className="data-[state=open]:bg-bg-hover">
                            Show more
                          </PillButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content width={300}>
                          {sortedTagFrequencies.slice(numVisibleTags).map(([tag, frequency]) => (
                            <DropdownMenu.Item
                              key={tag}
                              icon={<TagIcon16 />}
                              trailingVisual={
                                <span className="text-text-secondary eink:text-current">
                                  {frequency}
                                </span>
                              }
                              onClick={(event) => {
                                const qualifier = `${event.shiftKey ? "-" : ""}tag:${tag}`
                                onQueryChange(query ? `${query} ${qualifier}` : qualifier)
                              }}
                            >
                              {tag}
                            </DropdownMenu.Item>
                          ))}
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    ) : null}
                  </>
                ) : null}
              </div>
              {deferredQuery ? (
                <div className="text-sm text-text-secondary leading-4">
                  {pluralize(taskResults.length, "result")}
                </div>
              ) : null}
            </div>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {taskResults.slice(0, numVisibleItems).map((task) => (
              <motion.li
                key={`${task.note.id}-${task.startOffset}`}
                layout="position"
                transition={{
                  layout: {
                    type: "tween",
                    duration: shouldAnimateTasks ? 0.2 : 0,
                    ease: [0.2, 0, 0, 1],
                  },
                }}
                className="list-none"
              >
                <TaskItem
                  task={task}
                  noteId={task.note.id}
                  onCompletedChange={(completed) => {
                    enableTaskAnimation()

                    const updatedContent = updateTaskCompletion({
                      content: task.note.content,
                      task,
                      completed,
                    })

                    if (updatedContent !== task.note.content) {
                      saveNote({ id: task.note.id, content: updatedContent })
                    }
                  }}
                  onTextChange={(newText) => {
                    enableTaskAnimation()

                    const updatedContent = updateTaskText({
                      content: task.note.content,
                      task,
                      text: newText,
                    })

                    if (updatedContent !== task.note.content) {
                      saveNote({ id: task.note.id, content: updatedContent })
                    }
                  }}
                  onReschedule={(date) => {
                    enableTaskAnimation()

                    const updatedContent = scheduleTask({
                      content: task.note.content,
                      task,
                      date,
                    })

                    if (updatedContent !== task.note.content) {
                      saveNote({ id: task.note.id, content: updatedContent })
                    }
                  }}
                  onPriorityChange={(priority) => {
                    enableTaskAnimation()

                    const updatedContent = prioritizeTask({
                      content: task.note.content,
                      task,
                      priority,
                    })

                    if (updatedContent !== task.note.content) {
                      saveNote({ id: task.note.id, content: updatedContent })
                    }
                  }}
                  onDelete={() => {
                    enableTaskAnimation()

                    const updatedContent = deleteTask({
                      content: task.note.content,
                      task,
                    })

                    if (updatedContent !== task.note.content) {
                      saveNote({ id: task.note.id, content: updatedContent })
                    }
                  }}
                />
              </motion.li>
            ))}
          </ul>
        </div>

        {taskResults.length > numVisibleItems ? (
          <Button ref={bottomRef} className="mt-4 w-full" onClick={loadMore}>
            Load more
          </Button>
        ) : null}
      </div>
    </LinkHighlightProvider>
  )
}
