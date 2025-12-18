import { describe, expect, test, vi } from "vitest"
vi.mock("../global-state", () => ({
  sortedNotesAtom: {},
  noteSearcherAtom: {},
}))
import { parseQuery } from "./search"
import { filterNotes, sortNotes, testNoteFilters } from "./search-notes"
import type { Note } from "../schema"

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "1",
    content: "",
    type: "note",
    displayName: "",
    frontmatter: {},
    title: "",
    url: null,
    alias: null,
    pinned: false,
    links: [],
    dates: [],
    tags: [],
    tasks: [],
    backlinks: [],
    ...overrides,
  }
}

describe("filtering", () => {
  test("matches by tag, title, type, link and backlink, frontmatter, counts, dates, has and no filters", () => {
    const note = makeNote({
      type: "daily",
      title: "Title 1",
      frontmatter: { priority: "high" },
      tasks: [
        {
          completed: false,
          text: "do it",
          links: [],
          date: null,
          tags: [],
          priority: null,
          startOffset: 0,
        },
        {
          completed: true,
          text: "done",
          links: [],
          date: null,
          tags: [],
          priority: null,
          startOffset: 10,
        },
      ],
      tags: ["a", "b"],
      dates: ["2021-01-01", "2021-01-03"],
      links: ["x"],
      backlinks: ["y"],
    })

    expect(testNoteFilters([{ key: "id", values: [note.id], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "title", values: [note.title], exclude: false }], note)).toBe(
      true,
    )
    expect(testNoteFilters([{ key: "type", values: ["daily"], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "tag", values: ["a"], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "link", values: ["x"], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "backlink", values: ["y"], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "priority", values: ["high"], exclude: false }], note)).toBe(
      true,
    )

    expect(testNoteFilters([{ key: "tags", values: [">=2"], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "links", values: ["<2"], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "backlinks", values: ["1"], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "dates", values: ["2"], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "tasks", values: [">=1"], exclude: false }], note)).toBe(true)

    expect(
      testNoteFilters([{ key: "date", values: [">=2021-01-02"], exclude: false }], note),
    ).toBe(true)

    expect(testNoteFilters([{ key: "has", values: ["backlinks"], exclude: false }], note)).toBe(
      true,
    )
    expect(testNoteFilters([{ key: "no", values: ["tags"], exclude: false }], note)).toBe(false)

    expect(testNoteFilters([{ key: "tag", values: ["a"], exclude: true }], note)).toBe(false)
  })

  test("AND semantics across multiple filters", () => {
    const note = makeNote({ tags: ["a", "b"] })
    const filters = [
      { key: "tag", values: ["a"], exclude: false },
      { key: "tag", values: ["b"], exclude: false },
    ]
    expect(testNoteFilters(filters, note)).toBe(true)
  })

  test("filterNotes applies filters and removes non-matching notes", () => {
    const notes = [
      makeNote({ id: "1", tags: ["a"] }),
      makeNote({ id: "2", tags: ["b"] }),
      makeNote({ id: "3", tags: ["a", "b"] }),
    ]
    const filtered = filterNotes(notes, [{ key: "tag", values: ["a"], exclude: false }])
    expect(filtered.map((n) => n.id)).toEqual(["1", "3"])
  })

  test("has and no on frontmatter keys consider presence not truthiness", () => {
    const note = makeNote({ frontmatter: { read: false } })
    expect(testNoteFilters([{ key: "has", values: ["read"], exclude: false }], note)).toBe(true)
    expect(testNoteFilters([{ key: "no", values: ["read"], exclude: false }], note)).toBe(false)
  })

  test("has and no for title respect empty string and non-empty", () => {
    const emptyTitle = makeNote({ title: "" })
    const withTitle = makeNote({ title: "Hello" })
    expect(testNoteFilters([{ key: "no", values: ["title"], exclude: false }], emptyTitle)).toBe(
      true,
    )
    expect(testNoteFilters([{ key: "has", values: ["title"], exclude: false }], emptyTitle)).toBe(
      false,
    )
    expect(testNoteFilters([{ key: "has", values: ["title"], exclude: false }], withTitle)).toBe(
      true,
    )
  })

  test("AND with exclusion allows include and exclude combinations", () => {
    const aOnly = makeNote({ id: "1", tags: ["a"] })
    const aAndB = makeNote({ id: "2", tags: ["a", "b"] })
    const filters = [
      { key: "tag", values: ["a"], exclude: false },
      { key: "tag", values: ["b"], exclude: true },
    ]
    expect(testNoteFilters(filters, aOnly)).toBe(true)
    expect(testNoteFilters(filters, aAndB)).toBe(false)
  })

  test("task count filters match incomplete task counts with range operators", () => {
    const note = makeNote({
      tasks: [
        {
          completed: false,
          text: "x",
          links: [],
          date: null,
          tags: [],
          priority: null,
          startOffset: 0,
        },
      ],
    })
    expect(testNoteFilters([{ key: "tasks", values: ["0"], exclude: false }], note)).toBe(false)
    expect(testNoteFilters([{ key: "tasks", values: ["<=1"], exclude: false }], note)).toBe(true)
  })
})

describe("sorting", () => {
  test("sorts by tag count desc then id asc with punctuation and case ignored", () => {
    const notes = [
      makeNote({ id: "note-2", displayName: "A-2", tags: ["x"] }),
      makeNote({ id: "note 10", displayName: "A-1", tags: ["x", "y"] }),
      makeNote({ id: "note-1", displayName: "A-1", tags: [] }),
    ]
    const sorted = sortNotes(notes, [
      { key: "tags", direction: "desc" },
      { key: "id", direction: "asc" },
    ])
    expect(sorted.map((n) => n.id)).toEqual(["note 10", "note-2", "note-1"])
  })

  test("title sort ignores punctuation and case (asc) with id tiebreaker", () => {
    const notes = [
      makeNote({ id: "1", displayName: "B-2" }),
      makeNote({ id: "2", displayName: "A 1" }),
      makeNote({ id: "3", displayName: "A-1" }),
    ]
    const sorted = sortNotes(notes, [
      { key: "title", direction: "asc" },
      { key: "id", direction: "asc" },
    ])
    expect(sorted.map((n) => n.id)).toEqual(["2", "3", "1"]) // A(1) then B(2)
  })

  test("unknown sort key is ignored and next sort applies", () => {
    const notes = [makeNote({ id: "2", displayName: "A" }), makeNote({ id: "1", displayName: "A" })]
    const sorted = sortNotes(notes, [
      { key: "unknown", direction: "desc" },
      { key: "id", direction: "asc" },
    ])
    expect(sorted.map((n) => n.id)).toEqual(["1", "2"])
  })

  test("numeric collation sorts ids with embedded numbers in natural order", () => {
    const notes = [
      makeNote({ id: "note 2", displayName: "X" }),
      makeNote({ id: "note 10", displayName: "X" }),
      makeNote({ id: "note 1", displayName: "X" }),
    ]
    const sorted = sortNotes(notes, [{ key: "id", direction: "asc" }])
    expect(sorted.map((n) => n.id)).toEqual(["note 1", "note 2", "note 10"])
  })
})

describe("integration: parse + filter + sort", () => {
  test("filters by tag and sorts by title asc with punctuation ignored", () => {
    const notes = [
      makeNote({ id: "1", displayName: "B--", tags: ["a"] }),
      makeNote({ id: "2", displayName: "A!!", tags: ["a"] }),
      makeNote({ id: "3", displayName: "C??", tags: ["b"] }),
    ]
    const { filters, sorts } = parseQuery("tag:a sort:title")
    const filtered = filterNotes(notes, filters)
    const sorted = sortNotes(filtered, sorts)
    expect(sorted.map((n) => n.id)).toEqual(["2", "1"]) // A before B
  })

  test("default sort direction for links count is desc", () => {
    const notes = [
      makeNote({ id: "1", links: [] }),
      makeNote({ id: "2", links: ["x"] }),
      makeNote({ id: "3", links: ["x", "y"] }),
    ]
    const { sorts } = parseQuery("sort:links")
    const sorted = sortNotes(notes, sorts)
    expect(sorted.map((n) => n.id)).toEqual(["3", "2", "1"]) // desc by links count
  })

  test("exclusion filter excludes notes with matching tags", () => {
    const notes = [makeNote({ id: "1", tags: ["foo"] }), makeNote({ id: "2", tags: [] })]
    const { filters } = parseQuery("-tag:foo")
    const filtered = filterNotes(notes, filters)
    expect(filtered.map((n) => n.id)).toEqual(["2"])
  })
})
