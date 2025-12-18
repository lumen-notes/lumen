import type { TaskWithParent } from "../schema"
import type { Filter, Sort } from "./search"
import { isInRange } from "./search"

export function filterTasks(tasks: TaskWithParent[], filters: Filter[]): TaskWithParent[] {
  return tasks.filter((task) => testTaskFilters(filters, task))
}

export function testTaskFilters(filters: Filter[], task: TaskWithParent): boolean {
  return filters.every((filter) => testTaskFilter(filter, task))
}

export function testTaskFilter(filter: Filter, task: TaskWithParent): boolean {
  let value = false

  switch (filter.key) {
    case "completed":
      value = filter.values.includes(String(task.completed))
      break
    case "priority":
      if (task.priority === null) {
        value = false
      } else {
        value = filter.values.some((v) => isInRange(task.priority!, v))
      }
      break
    case "tag":
      value = task.tags.some((t) => filter.values.includes(t))
      break
    case "tags":
      value = filter.values.some((v) => isInRange(task.tags.length, v))
      break
    case "date":
      if (!task.date) {
        value = false
      } else {
        value = filter.values.some((v) => isInRange(task.date!, v))
      }
      break
    case "link":
      value = task.links.some((l) => filter.values.includes(l))
      break
    case "links":
      value = filter.values.some((v) => isInRange(task.links.length, v))
      break
    case "parent":
      value = filter.values.includes(task.parent.id)
      break
    case "type":
      value = filter.values.includes(task.parent.type)
      break
    case "has":
      value = filter.values.some((v) => {
        switch (v) {
          case "date":
            return task.date !== null
          case "priority":
            return task.priority !== null
          case "tag":
          case "tags":
            return task.tags.length > 0
          case "link":
          case "links":
            return task.links.length > 0
          default:
            return false
        }
      })
      break
    case "no":
      value = filter.values.some((v) => {
        switch (v) {
          case "date":
            return task.date === null
          case "priority":
            return task.priority === null
          case "tag":
          case "tags":
            return task.tags.length === 0
          case "link":
          case "links":
            return task.links.length === 0
          default:
            return false
        }
      })
      break
    default:
      break
  }

  return filter.exclude ? !value : value
}

export function sortTasks(tasks: TaskWithParent[], sorts: Sort[]): TaskWithParent[] {
  return [...tasks].sort((a, b) => compareTasks(a, b, sorts))
}

const collator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
  ignorePunctuation: true,
})

function compareTasks(a: TaskWithParent, b: TaskWithParent, sorts: Sort[]): number {
  for (const sort of sorts) {
    let result = 0

    switch (sort.key) {
      case "completed":
        // false (incomplete) before true (complete)
        result = Number(a.completed) - Number(b.completed)
        break
      case "date":
        // null dates always sort last (regardless of direction)
        if (a.date === null && b.date === null) result = 0
        else if (a.date === null)
          return 1 // a (null) goes after b
        else if (b.date === null)
          return -1 // b (null) goes after a
        else result = a.date.localeCompare(b.date)
        break
      case "priority":
        // null priority always sorts last (regardless of direction)
        if (a.priority === null && b.priority === null) result = 0
        else if (a.priority === null)
          return 1 // a (null) goes after b
        else if (b.priority === null)
          return -1 // b (null) goes after a
        else result = a.priority - b.priority
        break
      case "parent":
        result = collator.compare(a.parent.id, b.parent.id)
        break
      case "text":
        result = collator.compare(a.text, b.text)
        break
      default:
        continue
    }

    if (result !== 0) {
      return sort.direction === "desc" ? -result : result
    }
  }

  return 0
}
