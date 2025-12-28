import { useAtomValue } from "jotai"
import React from "react"
import type { FullOptions, Searcher as FuzzySearcher } from "fast-fuzzy"
import { taskSearcherAtom, tasksAtom } from "../global-state"
import { parseQuery } from "../utils/search"
import { filterTasks, sortTasks } from "../utils/search-tasks"
import type { TaskWithNote } from "../schema"

// Shared search routine used by both hooks
function runSearch(
  query: string,
  tasks: TaskWithNote[],
  taskSearcher: FuzzySearcher<TaskWithNote, FullOptions<TaskWithNote>>,
) {
  if (!query) return tasks
  const { fuzzy, filters, sorts } = parseQuery(query)
  const results = fuzzy ? taskSearcher.search(fuzzy) : tasks
  const filtered = filterTasks(results, filters)
  return sorts.length ? sortTasks(filtered, sorts) : filtered
}

export function useSearchTasks() {
  const tasks = useAtomValue(tasksAtom)
  const taskSearcher = useAtomValue(taskSearcherAtom)

  const searchTasks = React.useCallback(
    (query: string) => {
      return runSearch(query, tasks, taskSearcher)
    },
    [tasks, taskSearcher],
  )

  return searchTasks
}

// The same as useSearchTasks except the function value doesn't change when the tasks change.
// This is useful for implementing task autocomplete in CodeMirror.
export function useStableSearchTasks() {
  const tasks = useAtomValue(tasksAtom)
  const taskSearcher = useAtomValue(taskSearcherAtom)

  const tasksRef = React.useRef(tasks)
  const taskSearcherRef = React.useRef(taskSearcher)

  React.useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  React.useEffect(() => {
    taskSearcherRef.current = taskSearcher
  }, [taskSearcher])

  const searchTasks = React.useCallback((query: string) => {
    return runSearch(query, tasksRef.current, taskSearcherRef.current)
  }, [])

  return searchTasks
}
