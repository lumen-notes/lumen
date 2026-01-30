import { describe, expect, it } from "vitest"
import { Note, NoteId } from "../schema"
import { inlineNoteEmbeds } from "./inline-note-embeds"

// Helper to create a minimal note for testing
function createNote(id: NoteId, content: string): Note {
  return {
    id,
    content,
    type: "note",
    displayName: id,
    frontmatter: {},
    title: "",
    url: null,
    alias: null,
    pinned: false,
    updatedAt: null,
    dates: [],
    links: [],
    tags: [],
    tasks: [],
    backlinks: [],
  }
}

describe("inlineNoteEmbeds", () => {
  it("should replace basic embeds with blockquoted content", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("note1", createNote("note1", "This is the embedded content"))

    const input = `Here is an embed:

![[note1]]

After the embed.`
    const expected = `Here is an embed:

> This is the embedded content

After the embed.`
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should handle embeds with custom text (text is ignored, content is used)", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("note1", createNote("note1", "This is the content"))

    const input = "![[note1|Custom Text]]"
    const expected = "> This is the content"
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should handle multiline content in embeds", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("note1", createNote("note1", `Line 1
Line 2
Line 3`))

    const input = "![[note1]]"
    const expected = `> Line 1
> Line 2
> Line 3`
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should move inline embeds onto their own line", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("note1", createNote("note1", "Inline content"))

    const input = "Before ![[note1]] after"
    const expected = `Before

> Inline content

after`
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should keep inline embeds inside list items", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("note1", createNote("note1", "List content"))

    const input = "- Task ![[note1]] after"
    const indent = "  "
    const expected = `- Task
${indent}
${indent}> List content
${indent}
${indent}after`
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should remove embeds that reference non-existent notes", () => {
    const notes = new Map<NoteId, Note>()

    const input = "Before ![[nonexistent]] after"
    const expected = "Before  after"
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should handle multiple embeds in the same content", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("note1", createNote("note1", "Content 1"))
    notes.set("note2", createNote("note2", "Content 2"))

    const input = `![[note1]]

![[note2]]`
    const expected = `> Content 1

> Content 2`
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should separate multiple embeds on the same line", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("note1", createNote("note1", "Content 1"))
    notes.set("note2", createNote("note2", "Content 2"))

    const input = "![[note1]] ![[note2]]"
    const expected = `> Content 1

> Content 2`
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should inline embeds inside table rows", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("note1", createNote("note1", `Row 1
Row 2`))

    const input = "| ![[note1]] |"
    const expected = "| Row 1 Row 2 |"
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should strip frontmatter from embedded notes", () => {
    const notes = new Map<NoteId, Note>()
    notes.set(
      "note1",
      createNote(
        "note1",
        `---
title: Test
tags: [foo]
---

Actual content`,
      ),
    )

    const input = "![[note1]]"
    const expected = "> Actual content"
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should handle recursive embeds", () => {
    const notes = new Map<NoteId, Note>()
    notes.set(
      "parent",
      createNote(
        "parent",
        `Parent content

![[child]]`,
      ),
    )
    notes.set("child", createNote("child", "Child content"))

    const input = "![[parent]]"
    const expected = `> Parent content
> 
> > Child content`
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should prevent infinite loops with circular embeds", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("note1", createNote("note1", "Note 1 embeds ![[note2]]"))
    notes.set("note2", createNote("note2", "Note 2 embeds ![[note1]]"))

    const input = "![[note1]]"
    // Should not hang, circular reference is handled
    const result = inlineNoteEmbeds(input, notes)
    expect(result).toContain("> Note 1 embeds")
  })

  it("should respect max depth for recursive embeds", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("level1", createNote("level1", "Level 1: ![[level2]]"))
    notes.set("level2", createNote("level2", "Level 2: ![[level3]]"))
    notes.set("level3", createNote("level3", "Level 3: ![[level4]]"))
    notes.set("level4", createNote("level4", "Level 4 content"))

    // With maxDepth=2, level4 embed should not be processed
    const result = inlineNoteEmbeds("![[level1]]", notes, 2)
    expect(result).toContain("Level 1")
    expect(result).toContain("Level 2")
    expect(result).not.toContain("Level 4 content")
  })

  it("should preserve non-embed content", () => {
    const notes = new Map<NoteId, Note>()

    const input =
      "Regular text with *markdown* and [[wikilink]] and [regular link](https://example.com)"
    expect(inlineNoteEmbeds(input, notes)).toBe(input)
  })

  it("should handle embeds with empty content", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("empty", createNote("empty", ""))

    const input = "Before ![[empty]] after"
    const expected = "Before  after"
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })

  it("should handle embeds with only frontmatter", () => {
    const notes = new Map<NoteId, Note>()
    notes.set("frontmatter-only", createNote("frontmatter-only", "---\ntitle: Test\n---\n"))

    const input = "Before ![[frontmatter-only]] after"
    const expected = "Before  after"
    expect(inlineNoteEmbeds(input, notes)).toBe(expected)
  })
})
