import { describe, expect, it } from "vitest"
import {
  DEFAULT_CONFIG,
  getNoteFilepath,
  getNoteIdFromFilepath,
  isCalendarNoteId,
  normalizeDirectoryPath,
  parseConfigFromJson,
  serializeConfig,
} from "./config"

describe("parseConfigFromJson", () => {
  it("parses valid config", () => {
    const json = JSON.stringify({ calendarNotesDirectory: "journal" })
    expect(parseConfigFromJson(json)).toEqual({ calendarNotesDirectory: "journal" })
  })

  it("returns default config for invalid JSON", () => {
    expect(parseConfigFromJson("not valid json")).toEqual(DEFAULT_CONFIG)
  })

  it("returns default config for empty object", () => {
    expect(parseConfigFromJson("{}")).toEqual({})
  })

  it("ignores unknown properties", () => {
    const json = JSON.stringify({ calendarNotesDirectory: "daily", unknownProp: "value" })
    expect(parseConfigFromJson(json)).toEqual({ calendarNotesDirectory: "daily" })
  })
})

describe("serializeConfig", () => {
  it("serializes config to JSON", () => {
    const config = { calendarNotesDirectory: "journal" }
    const json = serializeConfig(config)
    expect(JSON.parse(json)).toEqual(config)
  })
})

describe("normalizeDirectoryPath", () => {
  it("removes leading slashes", () => {
    expect(normalizeDirectoryPath("/journal")).toBe("journal")
    expect(normalizeDirectoryPath("//journal")).toBe("journal")
  })

  it("removes trailing slashes", () => {
    expect(normalizeDirectoryPath("journal/")).toBe("journal")
    expect(normalizeDirectoryPath("journal//")).toBe("journal")
  })

  it("removes both leading and trailing slashes", () => {
    expect(normalizeDirectoryPath("/journal/")).toBe("journal")
  })

  it("handles nested paths", () => {
    expect(normalizeDirectoryPath("/notes/daily/")).toBe("notes/daily")
  })

  it("returns empty string for undefined", () => {
    expect(normalizeDirectoryPath(undefined)).toBe("")
  })

  it("returns empty string for empty string", () => {
    expect(normalizeDirectoryPath("")).toBe("")
  })
})

describe("isCalendarNoteId", () => {
  it("returns true for valid date strings", () => {
    expect(isCalendarNoteId("2025-01-26")).toBe(true)
    expect(isCalendarNoteId("2000-12-31")).toBe(true)
  })

  it("returns true for valid week strings", () => {
    expect(isCalendarNoteId("2025-W04")).toBe(true)
    expect(isCalendarNoteId("2025-W52")).toBe(true)
  })

  it("returns false for regular note IDs", () => {
    expect(isCalendarNoteId("my-note")).toBe(false)
    expect(isCalendarNoteId("some/path/note")).toBe(false)
    expect(isCalendarNoteId("1706313600000")).toBe(false)
  })

  it("returns false for invalid dates", () => {
    expect(isCalendarNoteId("2025-13-01")).toBe(false) // Invalid month
    expect(isCalendarNoteId("2025-1-26")).toBe(false) // Missing leading zero
  })
})

describe("getNoteFilepath", () => {
  it("returns simple filepath for non-calendar notes", () => {
    expect(getNoteFilepath("my-note", "")).toBe("my-note.md")
    expect(getNoteFilepath("my-note", "journal")).toBe("my-note.md")
    expect(getNoteFilepath("nested/note", "journal")).toBe("nested/note.md")
  })

  it("returns simple filepath for calendar notes when no directory configured", () => {
    expect(getNoteFilepath("2025-01-26", "")).toBe("2025-01-26.md")
    expect(getNoteFilepath("2025-W04", "")).toBe("2025-W04.md")
  })

  it("prepends directory for calendar notes when configured", () => {
    expect(getNoteFilepath("2025-01-26", "journal")).toBe("journal/2025-01-26.md")
    expect(getNoteFilepath("2025-W04", "daily")).toBe("daily/2025-W04.md")
    expect(getNoteFilepath("2025-01-26", "notes/calendar")).toBe("notes/calendar/2025-01-26.md")
  })
})

describe("getNoteIdFromFilepath", () => {
  it("returns ID without .md extension", () => {
    expect(getNoteIdFromFilepath("my-note.md", "")).toBe("my-note")
    expect(getNoteIdFromFilepath("nested/note.md", "")).toBe("nested/note")
  })

  it("returns calendar note ID when no directory configured", () => {
    expect(getNoteIdFromFilepath("2025-01-26.md", "")).toBe("2025-01-26")
    expect(getNoteIdFromFilepath("2025-W04.md", "")).toBe("2025-W04")
  })

  it("strips directory prefix for calendar notes in configured directory", () => {
    expect(getNoteIdFromFilepath("journal/2025-01-26.md", "journal")).toBe("2025-01-26")
    expect(getNoteIdFromFilepath("daily/2025-W04.md", "daily")).toBe("2025-W04")
    expect(getNoteIdFromFilepath("notes/calendar/2025-01-26.md", "notes/calendar")).toBe(
      "2025-01-26",
    )
  })

  it("does not strip prefix for non-calendar files in calendar directory", () => {
    expect(getNoteIdFromFilepath("journal/my-note.md", "journal")).toBe("journal/my-note")
    expect(getNoteIdFromFilepath("journal/readme.md", "journal")).toBe("journal/readme")
  })

  it("does not strip prefix for files in subdirectories of calendar directory", () => {
    expect(getNoteIdFromFilepath("journal/sub/2025-01-26.md", "journal")).toBe(
      "journal/sub/2025-01-26",
    )
  })

  it("does not strip prefix for calendar files not in configured directory", () => {
    expect(getNoteIdFromFilepath("other/2025-01-26.md", "journal")).toBe("other/2025-01-26")
  })
})
