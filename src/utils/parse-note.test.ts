import { describe, expect, test } from "vitest"
import { isNoteEmpty, parseNote } from "./parse-note"

describe("parseNote", () => {
  test("stores task markdown, links, and tags", () => {
    const tasks = parseNote("1234", "- [ ] Review [[project-alpha]] plan #ops").tasks

    expect(tasks).toEqual([
      {
        completed: false,
        text: "Review [[project-alpha]] plan #ops",
        displayText: "Review [[project-alpha]] plan #ops",
        links: ["project-alpha"],
        date: null,
        tags: ["ops"],
      },
    ])
  })

  test("emits nested subtasks and assigns dates based on position", () => {
    const tasks = parseNote(
      "1234",
      `
- [ ] [[2025-01-02]] Parent review #parent [[2024-12-31]]
  - [ ] Child follow up [[2023-04-04]] with [[note-b]] before due #child [[2023-05-05]]
`,
    ).tasks

    expect(tasks).toEqual([
      {
        completed: false,
        text: "[[2025-01-02]] Parent review #parent [[2024-12-31]]",
        displayText: "Parent review #parent [[2024-12-31]]",
        links: ["2025-01-02", "2024-12-31"],
        date: "2025-01-02",
        tags: ["parent"],
      },
      {
        completed: false,
        text: "Child follow up [[2023-04-04]] with [[note-b]] before due #child [[2023-05-05]]",
        displayText: "Child follow up [[2023-04-04]] with [[note-b]] before due #child",
        links: ["2023-04-04", "note-b", "2023-05-05"],
        date: "2023-05-05",
        tags: ["child"],
      },
    ])
  })
})

describe("isNoteEmpty", () => {
  test("returns true for empty string", () => {
    expect(isNoteEmpty({ markdown: "" })).toBe(true)
  })

  test("returns true for whitespace only", () => {
    expect(isNoteEmpty({ markdown: "   " })).toBe(true)
    expect(isNoteEmpty({ markdown: "\n\n" })).toBe(true)
  })

  test("returns false for note with title", () => {
    expect(isNoteEmpty({ markdown: "# Hello" })).toBe(false)
  })

  test("returns false for note with body", () => {
    expect(isNoteEmpty({ markdown: "Some content" })).toBe(false)
  })

  test("returns false for note with title and body", () => {
    expect(isNoteEmpty({ markdown: "# Title\n\nBody content" })).toBe(false)
  })

  test("returns false for note with visible frontmatter", () => {
    expect(isNoteEmpty({ markdown: "---\nauthor: John\n---\n" })).toBe(false)
  })

  test("returns true for note with only reserved frontmatter keys", () => {
    expect(isNoteEmpty({ markdown: "---\npinned: true\n---\n" })).toBe(true)
    expect(isNoteEmpty({ markdown: "---\ngist_id: abc123\n---\n" })).toBe(true)
    expect(isNoteEmpty({ markdown: "---\nfont: serif\n---\n" })).toBe(true)
    expect(isNoteEmpty({ markdown: "---\nwidth: full\n---\n" })).toBe(true)
  })

  test("returns true for note with empty array in frontmatter", () => {
    expect(isNoteEmpty({ markdown: "---\ntags: []\n---\n" })).toBe(true)
  })

  test("returns false for note with non-empty array in frontmatter", () => {
    expect(isNoteEmpty({ markdown: "---\ntags: [foo]\n---\n" })).toBe(false)
  })

  test("returns false for note with mixed reserved and visible frontmatter", () => {
    expect(isNoteEmpty({ markdown: "---\npinned: true\nauthor: John\n---\n" })).toBe(false)
  })

  test("returns true when hideFrontmatter is true and note has only frontmatter", () => {
    expect(isNoteEmpty({ markdown: "---\nauthor: John\n---\n", hideFrontmatter: true })).toBe(true)
  })

  test("returns false when hideFrontmatter is true but note has content", () => {
    expect(
      isNoteEmpty({ markdown: "---\nauthor: John\n---\nSome content", hideFrontmatter: true }),
    ).toBe(false)
  })
})
