import { describe, expect, test, vi } from "vitest"
vi.mock("../global-state", () => ({
  sortedNotesAtom: {},
  noteSearcherAtom: {},
}))
import { isInRange, parseQuery, resolveRelativeDate } from "./search"
import { filterNotes, sortNotes } from "./search-notes"
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
    updatedAt: null,
    links: [],
    dates: [],
    tags: [],
    tasks: [],
    backlinks: [],
    ...overrides,
  }
}

describe("parseQuery", () => {
  test("parses quoted values, comma lists, exclusions, and multiple sorts", () => {
    const q = parseQuery('foo tag:a,b title:"hello, world" -tag:c sort:title,id:desc,links')
    expect(q.fuzzy).toBe("foo")
    expect(q.filters).toEqual([
      { key: "tag", values: ["a", "b"], exclude: false },
      { key: "title", values: ["hello, world"], exclude: false },
      { key: "tag", values: ["c"], exclude: true },
    ])
    expect(q.sorts).toEqual([
      { key: "title", direction: "asc" },
      { key: "id", direction: "desc" },
      { key: "links", direction: "desc" },
    ])
  })

  test("treats unknown qualifiers as frontmatter filters and trims fuzzy", () => {
    const q = parseQuery("hello priority:high")
    expect(q.fuzzy).toBe("hello")
    expect(q.filters).toEqual([{ key: "priority", values: ["high"], exclude: false }])
  })

  test("parses multiple sort qualifiers and ignores exclude on sort", () => {
    const q = parseQuery("sort:title -sort:id:desc")
    expect(q.sorts).toEqual([
      { key: "title", direction: "asc" },
      { key: "id", direction: "desc" },
    ])
  })

  test("supports hyphenated keys and quoted values with commas and hyphens", () => {
    const q = parseQuery('foo foo-bar:"a-b, c"')
    expect(q.fuzzy).toBe("foo")
    expect(q.filters).toEqual([{ key: "foo-bar", values: ["a-b, c"], exclude: false }])
  })

  test("trims fuzzy text and preserves inner spacing", () => {
    const q = parseQuery("   hello   world   tag:a   ")
    expect(q.fuzzy).toBe("hello   world")
  })

  test("applies default sort directions when omitted per key", () => {
    const q = parseQuery("sort:tags:asc,links,backlinks:desc")
    expect(q.sorts).toEqual([
      { key: "tags", direction: "asc" },
      { key: "links", direction: "desc" },
      { key: "backlinks", direction: "desc" },
    ])
  })
})

describe("resolveRelativeDate", () => {
  test("resolves 'today' to current date", () => {
    const today = resolveRelativeDate("today")
    // Should be a valid ISO date
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test("resolves 'tomorrow' to day after today", () => {
    const today = resolveRelativeDate("today")
    const tomorrow = resolveRelativeDate("tomorrow")
    // Tomorrow should be greater than today
    expect(tomorrow > today).toBe(true)
  })

  test("resolves 'yesterday' to day before today", () => {
    const today = resolveRelativeDate("today")
    const yesterday = resolveRelativeDate("yesterday")
    // Yesterday should be less than today
    expect(yesterday < today).toBe(true)
  })

  test("resolves 'next+week' syntax with plus signs", () => {
    const today = resolveRelativeDate("today")
    const nextWeek = resolveRelativeDate("next+week")
    // next week should be greater than today
    expect(nextWeek > today).toBe(true)
  })

  test("returns original value for non-date strings", () => {
    expect(resolveRelativeDate("foo")).toBe("foo")
  })

  test("returns original value for ISO dates", () => {
    expect(resolveRelativeDate("2024-01-15")).toBe("2024-01-15")
  })
})

describe("isInRange with relative dates", () => {
  test("matches exact relative date", () => {
    const today = resolveRelativeDate("today")
    const yesterday = resolveRelativeDate("yesterday")
    expect(isInRange(today, "today")).toBe(true)
    expect(isInRange(yesterday, "today")).toBe(false)
  })

  test("supports >= with relative dates", () => {
    const today = resolveRelativeDate("today")
    const tomorrow = resolveRelativeDate("tomorrow")
    const yesterday = resolveRelativeDate("yesterday")
    expect(isInRange(today, ">=today")).toBe(true)
    expect(isInRange(tomorrow, ">=today")).toBe(true)
    expect(isInRange(yesterday, ">=today")).toBe(false)
  })

  test("supports < with relative dates", () => {
    const today = resolveRelativeDate("today")
    const yesterday = resolveRelativeDate("yesterday")
    expect(isInRange(yesterday, "<today")).toBe(true)
    expect(isInRange(today, "<today")).toBe(false)
  })

  test("supports <= with relative dates", () => {
    const today = resolveRelativeDate("today")
    const tomorrow = resolveRelativeDate("tomorrow")
    expect(isInRange(today, "<=today")).toBe(true)
    expect(isInRange(tomorrow, "<=today")).toBe(false)
  })

  test("supports > with relative dates", () => {
    const today = resolveRelativeDate("today")
    const tomorrow = resolveRelativeDate("tomorrow")
    expect(isInRange(tomorrow, ">today")).toBe(true)
    expect(isInRange(today, ">today")).toBe(false)
  })
})

describe("sorting", () => {
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

  test("sort by updated_at defaults to desc (most recent first)", () => {
    const notes = [
      makeNote({ id: "1", updatedAt: 1000 }),
      makeNote({ id: "2", updatedAt: 3000 }),
      makeNote({ id: "3", updatedAt: 2000 }),
      makeNote({ id: "4", updatedAt: null }), // no timestamp sorts to end
    ]
    const { sorts } = parseQuery("sort:updated_at")
    const sorted = sortNotes(notes, sorts)
    expect(sorted.map((n) => n.id)).toEqual(["2", "3", "1", "4"])
  })

  test("exclusion filter excludes notes with matching tags", () => {
    const notes = [makeNote({ id: "1", tags: ["foo"] }), makeNote({ id: "2", tags: [] })]
    const { filters } = parseQuery("-tag:foo")
    const filtered = filterNotes(notes, filters)
    expect(filtered.map((n) => n.id)).toEqual(["2"])
  })

  test("sort by arbitrary frontmatter key (numeric)", () => {
    const notes = [
      makeNote({ id: "1", frontmatter: { priority: 3 } }),
      makeNote({ id: "2", frontmatter: { priority: 1 } }),
      makeNote({ id: "3", frontmatter: {} }), // missing key sorts to end
      makeNote({ id: "4", frontmatter: { priority: 2 } }),
    ]
    const { sorts } = parseQuery("sort:priority")
    const sorted = sortNotes(notes, sorts)
    expect(sorted.map((n) => n.id)).toEqual(["2", "4", "1", "3"])
  })

  test("sort by arbitrary frontmatter key (string)", () => {
    const notes = [
      makeNote({ id: "1", frontmatter: { status: "draft" } }),
      makeNote({ id: "2", frontmatter: { status: "published" } }),
      makeNote({ id: "3", frontmatter: { status: "archived" } }),
    ]
    const { sorts } = parseQuery("sort:status")
    const sorted = sortNotes(notes, sorts)
    expect(sorted.map((n) => n.id)).toEqual(["3", "1", "2"]) // archived, draft, published
  })
})
