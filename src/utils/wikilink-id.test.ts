import { describe, expect, it } from "vitest"
import { isValidWikilinkId } from "./wikilink-id"

describe("isValidWikilinkId", () => {
  it("accepts valid ids", () => {
    expect(isValidWikilinkId("project-alpha")).toBe(true)
    expect(isValidWikilinkId("My note 01")).toBe(true)
    expect(isValidWikilinkId("2024-01-01")).toBe(true)
    expect(isValidWikilinkId("note!$&'()*+,;@{}")).toBe(true)
  })

  it("rejects invalid ids", () => {
    expect(isValidWikilinkId("")).toBe(false)
    expect(isValidWikilinkId("note/with/slash")).toBe(false)
    expect(isValidWikilinkId("note|alias")).toBe(false)
    expect(isValidWikilinkId("note[1]")).toBe(false)
  })
})
