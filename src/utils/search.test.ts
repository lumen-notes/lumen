import { describe, expect, test } from "vitest"
import { parseQuery } from "./search"

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
