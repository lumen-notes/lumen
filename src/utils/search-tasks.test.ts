import { describe, expect, test } from "vitest"
import { parseQuery } from "./search"
import { filterTasks, sortTasks, testTaskFilter, testTaskFilters } from "./search-tasks"
import type { Note, TaskWithNote } from "../schema"

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "note-1",
    content: "",
    type: "note",
    displayName: "",
    frontmatter: {},
    title: "",
    url: null,
    alias: null,
    pinned: false,
    updatedAt: null,
    links: [],
    dates: [],
    tags: [],
    tasks: [],
    backlinks: [],
    ...overrides,
  }
}

function makeTask(overrides: Partial<TaskWithNote> = {}): TaskWithNote {
  return {
    completed: false,
    text: "do something",
    links: [],
    tags: [],
    date: null,
    priority: null,
    startOffset: 0,
    note: makeNote(),
    ...overrides,
  }
}

describe("filtering", () => {
  test("filters by completed status", () => {
    const incomplete = makeTask({ completed: false })
    const complete = makeTask({ completed: true })

    expect(
      testTaskFilter({ key: "completed", values: ["false"], exclude: false }, incomplete),
    ).toBe(true)
    expect(testTaskFilter({ key: "completed", values: ["false"], exclude: false }, complete)).toBe(
      false,
    )
    expect(testTaskFilter({ key: "completed", values: ["true"], exclude: false }, complete)).toBe(
      true,
    )
  })

  test("filters by priority with exact match", () => {
    const p1 = makeTask({ priority: 1 })
    const p2 = makeTask({ priority: 2 })
    const noPriority = makeTask({ priority: null })

    expect(testTaskFilter({ key: "priority", values: ["1"], exclude: false }, p1)).toBe(true)
    expect(testTaskFilter({ key: "priority", values: ["1"], exclude: false }, p2)).toBe(false)
    expect(testTaskFilter({ key: "priority", values: ["1"], exclude: false }, noPriority)).toBe(
      false,
    )
  })

  test("filters by priority with range operators", () => {
    const p1 = makeTask({ priority: 1 })
    const p2 = makeTask({ priority: 2 })
    const p3 = makeTask({ priority: 3 })

    expect(testTaskFilter({ key: "priority", values: ["<=2"], exclude: false }, p1)).toBe(true)
    expect(testTaskFilter({ key: "priority", values: ["<=2"], exclude: false }, p2)).toBe(true)
    expect(testTaskFilter({ key: "priority", values: ["<=2"], exclude: false }, p3)).toBe(false)
  })

  test("filters by priority with multiple values (OR)", () => {
    const p1 = makeTask({ priority: 1 })
    const p2 = makeTask({ priority: 2 })
    const p3 = makeTask({ priority: 3 })

    expect(testTaskFilter({ key: "priority", values: ["1", "2"], exclude: false }, p1)).toBe(true)
    expect(testTaskFilter({ key: "priority", values: ["1", "2"], exclude: false }, p2)).toBe(true)
    expect(testTaskFilter({ key: "priority", values: ["1", "2"], exclude: false }, p3)).toBe(false)
  })

  test("filters by tag", () => {
    const task = makeTask({ tags: ["work", "urgent"] })

    expect(testTaskFilter({ key: "tag", values: ["work"], exclude: false }, task)).toBe(true)
    expect(testTaskFilter({ key: "tag", values: ["home"], exclude: false }, task)).toBe(false)
    expect(testTaskFilter({ key: "tag", values: ["work", "home"], exclude: false }, task)).toBe(
      true,
    ) // OR
  })

  test("filters by tags count", () => {
    const noTags = makeTask({ tags: [] })
    const twoTags = makeTask({ tags: ["a", "b"] })

    expect(testTaskFilter({ key: "tags", values: [">=2"], exclude: false }, twoTags)).toBe(true)
    expect(testTaskFilter({ key: "tags", values: [">=2"], exclude: false }, noTags)).toBe(false)
  })

  test("filters by date", () => {
    const dated = makeTask({ date: "2024-01-15" })
    const noDate = makeTask({ date: null })

    expect(testTaskFilter({ key: "date", values: ["2024-01-15"], exclude: false }, dated)).toBe(
      true,
    )
    expect(testTaskFilter({ key: "date", values: ["2024-01-15"], exclude: false }, noDate)).toBe(
      false,
    )
  })

  test("filters by date with range operators", () => {
    const jan15 = makeTask({ date: "2024-01-15" })
    const jan20 = makeTask({ date: "2024-01-20" })

    expect(testTaskFilter({ key: "date", values: [">=2024-01-15"], exclude: false }, jan15)).toBe(
      true,
    )
    expect(testTaskFilter({ key: "date", values: ["<2024-01-15"], exclude: false }, jan15)).toBe(
      false,
    )
    expect(testTaskFilter({ key: "date", values: ["<=2024-01-15"], exclude: false }, jan20)).toBe(
      false,
    )
  })

  test("filters by link", () => {
    const task = makeTask({ links: ["note-a", "note-b"] })

    expect(testTaskFilter({ key: "link", values: ["note-a"], exclude: false }, task)).toBe(true)
    expect(testTaskFilter({ key: "link", values: ["note-c"], exclude: false }, task)).toBe(false)
  })

  test("filters by links count", () => {
    const noLinks = makeTask({ links: [] })
    const hasLinks = makeTask({ links: ["a", "b"] })

    expect(testTaskFilter({ key: "links", values: [">=1"], exclude: false }, hasLinks)).toBe(true)
    expect(testTaskFilter({ key: "links", values: [">=1"], exclude: false }, noLinks)).toBe(false)
  })

  test("filters by note id", () => {
    const task = makeTask({ note: makeNote({ id: "daily-2024-01-15" }) })

    expect(
      testTaskFilter({ key: "note", values: ["daily-2024-01-15"], exclude: false }, task),
    ).toBe(true)
    expect(testTaskFilter({ key: "note", values: ["other-note"], exclude: false }, task)).toBe(
      false,
    )
  })

  test("filters by note type", () => {
    const dailyTask = makeTask({ note: makeNote({ type: "daily" }) })
    const noteTask = makeTask({ note: makeNote({ type: "note" }) })

    expect(testTaskFilter({ key: "type", values: ["daily"], exclude: false }, dailyTask)).toBe(true)
    expect(testTaskFilter({ key: "type", values: ["daily"], exclude: false }, noteTask)).toBe(false)
  })

  test("has filter checks property presence", () => {
    const withDate = makeTask({ date: "2024-01-15" })
    const withPriority = makeTask({ priority: 1 })
    const withTags = makeTask({ tags: ["work"] })
    const withLinks = makeTask({ links: ["note-a"] })
    const empty = makeTask()

    expect(testTaskFilter({ key: "has", values: ["date"], exclude: false }, withDate)).toBe(true)
    expect(testTaskFilter({ key: "has", values: ["date"], exclude: false }, empty)).toBe(false)
    expect(testTaskFilter({ key: "has", values: ["priority"], exclude: false }, withPriority)).toBe(
      true,
    )
    expect(testTaskFilter({ key: "has", values: ["priority"], exclude: false }, empty)).toBe(false)
    expect(testTaskFilter({ key: "has", values: ["tags"], exclude: false }, withTags)).toBe(true)
    expect(testTaskFilter({ key: "has", values: ["tags"], exclude: false }, empty)).toBe(false)
    expect(testTaskFilter({ key: "has", values: ["links"], exclude: false }, withLinks)).toBe(true)
    expect(testTaskFilter({ key: "has", values: ["links"], exclude: false }, empty)).toBe(false)
  })

  test("no filter checks property absence", () => {
    const withDate = makeTask({ date: "2024-01-15" })
    const withPriority = makeTask({ priority: 1 })
    const empty = makeTask()

    expect(testTaskFilter({ key: "no", values: ["date"], exclude: false }, empty)).toBe(true)
    expect(testTaskFilter({ key: "no", values: ["date"], exclude: false }, withDate)).toBe(false)
    expect(testTaskFilter({ key: "no", values: ["priority"], exclude: false }, empty)).toBe(true)
    expect(testTaskFilter({ key: "no", values: ["priority"], exclude: false }, withPriority)).toBe(
      false,
    )
  })

  test("exclusion filter negates result", () => {
    const task = makeTask({ tags: ["work"] })

    expect(testTaskFilter({ key: "tag", values: ["work"], exclude: true }, task)).toBe(false)
    expect(testTaskFilter({ key: "tag", values: ["home"], exclude: true }, task)).toBe(true)
  })

  test("AND semantics across multiple filters", () => {
    const task = makeTask({ tags: ["work", "urgent"], priority: 1 })

    const filters = [
      { key: "tag", values: ["work"], exclude: false },
      { key: "priority", values: ["1"], exclude: false },
    ]
    expect(testTaskFilters(filters, task)).toBe(true)

    const failingFilters = [
      { key: "tag", values: ["work"], exclude: false },
      { key: "priority", values: ["2"], exclude: false },
    ]
    expect(testTaskFilters(failingFilters, task)).toBe(false)
  })

  test("AND with exclusion combinations", () => {
    const workTask = makeTask({ tags: ["work"] })
    const workArchivedTask = makeTask({ tags: ["work", "archived"] })

    const filters = [
      { key: "tag", values: ["work"], exclude: false },
      { key: "tag", values: ["archived"], exclude: true },
    ]
    expect(testTaskFilters(filters, workTask)).toBe(true)
    expect(testTaskFilters(filters, workArchivedTask)).toBe(false)
  })

  test("filterTasks applies filters and returns matching tasks", () => {
    const tasks = [
      makeTask({ completed: false, tags: ["work"] }),
      makeTask({ completed: true, tags: ["work"] }),
      makeTask({ completed: false, tags: ["home"] }),
    ]

    const filtered = filterTasks(tasks, [
      { key: "completed", values: ["false"], exclude: false },
      { key: "tag", values: ["work"], exclude: false },
    ])

    expect(filtered).toHaveLength(1)
    expect(filtered[0].tags).toContain("work")
    expect(filtered[0].completed).toBe(false)
  })
})

describe("sorting", () => {
  test("sorts by completed status (incomplete first)", () => {
    const tasks = [
      makeTask({ text: "a", completed: true }),
      makeTask({ text: "b", completed: false }),
      makeTask({ text: "c", completed: true }),
    ]

    const sorted = sortTasks(tasks, [{ key: "completed", direction: "asc" }])
    expect(sorted.map((t) => t.text)).toEqual(["b", "a", "c"])
  })

  test("sorts by completed status desc (complete first)", () => {
    const tasks = [
      makeTask({ text: "a", completed: false }),
      makeTask({ text: "b", completed: true }),
    ]

    const sorted = sortTasks(tasks, [{ key: "completed", direction: "desc" }])
    expect(sorted.map((t) => t.text)).toEqual(["b", "a"])
  })

  test("sorts by date with nulls last", () => {
    const tasks = [
      makeTask({ text: "no-date", date: null }),
      makeTask({ text: "jan-20", date: "2024-01-20" }),
      makeTask({ text: "jan-15", date: "2024-01-15" }),
    ]

    const sorted = sortTasks(tasks, [{ key: "date", direction: "asc" }])
    expect(sorted.map((t) => t.text)).toEqual(["jan-15", "jan-20", "no-date"])
  })

  test("sorts by date desc with nulls last", () => {
    const tasks = [
      makeTask({ text: "no-date", date: null }),
      makeTask({ text: "jan-15", date: "2024-01-15" }),
      makeTask({ text: "jan-20", date: "2024-01-20" }),
    ]

    const sorted = sortTasks(tasks, [{ key: "date", direction: "desc" }])
    expect(sorted.map((t) => t.text)).toEqual(["jan-20", "jan-15", "no-date"])
  })

  test("sorts by priority with nulls last", () => {
    const tasks = [
      makeTask({ text: "no-priority", priority: null }),
      makeTask({ text: "p3", priority: 3 }),
      makeTask({ text: "p1", priority: 1 }),
    ]

    const sorted = sortTasks(tasks, [{ key: "priority", direction: "asc" }])
    expect(sorted.map((t) => t.text)).toEqual(["p1", "p3", "no-priority"])
  })

  test("sorts by priority desc with nulls last", () => {
    const tasks = [
      makeTask({ text: "no-priority", priority: null }),
      makeTask({ text: "p1", priority: 1 }),
      makeTask({ text: "p3", priority: 3 }),
    ]

    const sorted = sortTasks(tasks, [{ key: "priority", direction: "desc" }])
    expect(sorted.map((t) => t.text)).toEqual(["p3", "p1", "no-priority"])
  })

  test("sorts by note id", () => {
    const tasks = [
      makeTask({ text: "c", note: makeNote({ id: "note-3" }) }),
      makeTask({ text: "a", note: makeNote({ id: "note-1" }) }),
      makeTask({ text: "b", note: makeNote({ id: "note-2" }) }),
    ]

    const sorted = sortTasks(tasks, [{ key: "note", direction: "asc" }])
    expect(sorted.map((t) => t.text)).toEqual(["a", "b", "c"])
  })

  test("sorts by text alphabetically", () => {
    const tasks = [
      makeTask({ text: "Charlie" }),
      makeTask({ text: "alpha" }),
      makeTask({ text: "Beta" }),
    ]

    const sorted = sortTasks(tasks, [{ key: "text", direction: "asc" }])
    expect(sorted.map((t) => t.text)).toEqual(["alpha", "Beta", "Charlie"])
  })

  test("multi-key sorting applies keys in order", () => {
    const tasks = [
      makeTask({ text: "a", priority: 2, date: "2024-01-20" }),
      makeTask({ text: "b", priority: 1, date: "2024-01-15" }),
      makeTask({ text: "c", priority: 1, date: "2024-01-20" }),
    ]

    const sorted = sortTasks(tasks, [
      { key: "priority", direction: "asc" },
      { key: "date", direction: "asc" },
    ])
    expect(sorted.map((t) => t.text)).toEqual(["b", "c", "a"])
  })

  test("unknown sort key is ignored", () => {
    const tasks = [makeTask({ text: "b" }), makeTask({ text: "a" })]

    const sorted = sortTasks(tasks, [
      { key: "unknown", direction: "asc" },
      { key: "text", direction: "asc" },
    ])
    expect(sorted.map((t) => t.text)).toEqual(["a", "b"])
  })
})

describe("integration: parse + filter + sort", () => {
  test("filters incomplete high-priority tasks", () => {
    const tasks = [
      makeTask({ text: "urgent", completed: false, priority: 1 }),
      makeTask({ text: "done", completed: true, priority: 1 }),
      makeTask({ text: "low", completed: false, priority: 3 }),
    ]

    const { filters } = parseQuery("completed:false priority:1")
    const result = filterTasks(tasks, filters)

    expect(result).toHaveLength(1)
    expect(result[0].text).toBe("urgent")
  })

  test("filters and sorts by priority then date", () => {
    const tasks = [
      makeTask({ text: "c", priority: 2, date: "2024-01-20" }),
      makeTask({ text: "a", priority: 1, date: "2024-01-15" }),
      makeTask({ text: "b", priority: 1, date: "2024-01-20" }),
    ]

    const { filters, sorts } = parseQuery("has:priority sort:priority,date")
    const filtered = filterTasks(tasks, filters)
    const sorted = sortTasks(filtered, sorts)

    expect(sorted.map((t) => t.text)).toEqual(["a", "b", "c"])
  })

  test("excludes completed tasks from daily notes", () => {
    const tasks = [
      makeTask({ text: "a", completed: false, note: makeNote({ type: "daily" }) }),
      makeTask({ text: "b", completed: true, note: makeNote({ type: "daily" }) }),
      makeTask({ text: "c", completed: false, note: makeNote({ type: "note" }) }),
    ]

    const { filters } = parseQuery("type:daily -completed:true")
    const result = filterTasks(tasks, filters)

    expect(result).toHaveLength(1)
    expect(result[0].text).toBe("a")
  })

  test("filters work tasks without dates", () => {
    const tasks = [
      makeTask({ text: "a", tags: ["work"], date: null }),
      makeTask({ text: "b", tags: ["work"], date: "2024-01-15" }),
      makeTask({ text: "c", tags: ["home"], date: null }),
    ]

    const { filters } = parseQuery("tag:work no:date")
    const result = filterTasks(tasks, filters)

    expect(result).toHaveLength(1)
    expect(result[0].text).toBe("a")
  })
})
