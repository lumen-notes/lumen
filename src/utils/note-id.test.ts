import { describe, expect, it } from "vitest"
import { generateNoteId, getInvalidNoteIdCharacters, isValidNoteId } from "./note-id"

describe("isValidNoteId", () => {
  it("accepts valid ids", () => {
    expect(isValidNoteId("project-alpha")).toBe(true)
    expect(isValidNoteId("My note 01")).toBe(true)
    expect(isValidNoteId("2024-01-01")).toBe(true)
    expect(isValidNoteId("note!$&'()*+,;@{}")).toBe(true)
    expect(isValidNoteId("note/with/slash")).toBe(true)
  })

  it("rejects invalid ids", () => {
    expect(isValidNoteId("")).toBe(false)
    expect(isValidNoteId("note|alias")).toBe(false)
    expect(isValidNoteId("note[1]")).toBe(false)
  })
})

describe("getInvalidNoteIdCharacters", () => {
  it("returns invalid characters", () => {
    expect(getInvalidNoteIdCharacters("note/with|bad[chars]")).toEqual(["|", "[", "]"])
  })

  it("returns empty for valid ids", () => {
    expect(getInvalidNoteIdCharacters("valid-note")).toEqual([])
  })
})

describe("generateNoteId", () => {
  it("returns a numeric string", () => {
    expect(generateNoteId()).toMatch(/^\d+$/)
  })
})
