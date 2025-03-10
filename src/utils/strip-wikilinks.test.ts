import { describe, expect, it } from "vitest"
import { stripWikilinks } from "./strip-wikilinks"

describe("stripWikilinks", () => {
  it("should replace basic wikilinks with their IDs", () => {
    const input = "Here is a [[1234]] wikilink"
    const expected = "Here is a 1234 wikilink"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should replace wikilinks with custom text", () => {
    const input = "Here is a [[1234|Custom Text]] wikilink"
    const expected = "Here is a Custom Text wikilink"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should format date wikilinks", () => {
    const input = "Meeting on [[2024-03-20]]"
    const expected = "Meeting on Wed, Mar 20, 2024"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should format week wikilinks", () => {
    const input = "Tasks for [[2024-W12]]"
    const expected = "Tasks for Week 12, 2024"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should handle multiple wikilinks in the same content", () => {
    const input = "[[1234]] and [[5678|Other Note]] and [[2024-03-20]]"
    const expected = "1234 and Other Note and Wed, Mar 20, 2024"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should preserve non-wikilink content", () => {
    const input = "Regular text with *markdown* and [regular link](https://example.com)"
    expect(stripWikilinks(input)).toBe(input)
  })
})
