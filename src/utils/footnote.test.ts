import { describe, expect, it } from "vitest"
import { getFootnoteContent } from "./footnote"

describe("getFootnoteContent", () => {
  it("should return single-line footnote content", () => {
    const markdown = "Some text\n\n[^1]: This is a footnote"
    expect(getFootnoteContent(markdown, "1")).toBe("This is a footnote")
  })

  it("should return multi-line footnote content", () => {
    const markdown = "[^1]: First line\n    Second line\n    Third line"
    expect(getFootnoteContent(markdown, "1")).toBe("First line\nSecond line\nThird line")
  })

  it("should handle blank lines in multi-line footnotes", () => {
    const markdown = "[^1]: First paragraph\n\n    Second paragraph"
    expect(getFootnoteContent(markdown, "1")).toBe("First paragraph\n\nSecond paragraph")
  })

  it("should stop at non-indented, non-empty lines", () => {
    const markdown = "[^1]: Footnote content\nNot part of footnote"
    expect(getFootnoteContent(markdown, "1")).toBe("Footnote content")
  })

  it("should return null if footnote is not found", () => {
    const markdown = "Some text without footnotes"
    expect(getFootnoteContent(markdown, "1")).toBeNull()
  })

  it("should return null if footnote content is empty", () => {
    const markdown = "[^1]: "
    expect(getFootnoteContent(markdown, "1")).toBeNull()
  })

  it("should match footnote ids case-insensitively and with collapsed whitespace", () => {
    const markdown = "[^My Note]: Footnote content"
    expect(getFootnoteContent(markdown, "my note")).toBe("Footnote content")
  })

  it("should match percent-encoded footnote ids from rendered links", () => {
    const markdown = "[^My Note]: Footnote content"
    expect(getFootnoteContent(markdown, "my%20note")).toBe("Footnote content")
  })

  it("should handle missing space after the definition colon", () => {
    const markdown = "[^1]:Footnote content"
    expect(getFootnoteContent(markdown, "1")).toBe("Footnote content")
  })

  it("should handle named footnote ids", () => {
    const markdown = "[^note]: Named footnote content"
    expect(getFootnoteContent(markdown, "note")).toBe("Named footnote content")
  })

  it("should find the correct footnote among multiple", () => {
    const markdown = "[^1]: First\n[^2]: Second\n[^3]: Third"
    expect(getFootnoteContent(markdown, "2")).toBe("Second")
  })

  it("should strip 4-space indentation from continuation lines", () => {
    const markdown = "[^1]: Line one\n    Line two\n    Line three"
    expect(getFootnoteContent(markdown, "1")).toBe("Line one\nLine two\nLine three")
  })
})
