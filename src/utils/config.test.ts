import { describe, expect, it } from "vitest"
import {
  DEFAULT_CONFIG,
  buildCalendarNoteId,
  getCalendarNoteBasename,
  isCalendarNoteId,
  normalizeDirectoryPath,
  parseConfigFromJson,
  serializeConfig,
} from "./config"

describe("parseConfigFromJson", () => {
  it("parses valid config", () => {
    const json = JSON.stringify({ calendarNotesDir: "journal" })
    expect(parseConfigFromJson(json)).toEqual({ calendarNotesDir: "journal" })
  })

  it("returns default config for invalid JSON", () => {
    expect(parseConfigFromJson("not valid json")).toEqual(DEFAULT_CONFIG)
  })

  it("returns default config for empty object", () => {
    expect(parseConfigFromJson("{}")).toEqual({})
  })

  it("ignores unknown properties", () => {
    const json = JSON.stringify({ calendarNotesDir: "daily", unknownProp: "value" })
    expect(parseConfigFromJson(json)).toEqual({ calendarNotesDir: "daily" })
  })
})

describe("serializeConfig", () => {
  it("serializes config to JSON", () => {
    const config = { calendarNotesDir: "journal" }
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
  describe("without directory parameter (backward compatible)", () => {
    it("returns true for valid date strings", () => {
      expect(isCalendarNoteId("2025-01-26")).toBe(true)
      expect(isCalendarNoteId("2000-12-31")).toBe(true)
    })

    it("returns true for valid week strings", () => {
      expect(isCalendarNoteId("2025-W04")).toBe(true)
      expect(isCalendarNoteId("2025-W52")).toBe(true)
    })

    it("returns true for calendar notes with directory prefix", () => {
      expect(isCalendarNoteId("journal/2025-01-26")).toBe(true)
      expect(isCalendarNoteId("notes/daily/2025-W04")).toBe(true)
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

  describe("with empty directory (root only)", () => {
    it("returns true for date notes at root", () => {
      expect(isCalendarNoteId("2025-01-26", "")).toBe(true)
      expect(isCalendarNoteId("2025-W04", "")).toBe(true)
    })

    it("returns false for date notes in directories", () => {
      expect(isCalendarNoteId("journal/2025-01-26", "")).toBe(false)
      expect(isCalendarNoteId("notes/2025-W04", "")).toBe(false)
    })
  })

  describe("with configured directory", () => {
    it("returns true for date notes in configured directory", () => {
      expect(isCalendarNoteId("journal/2025-01-26", "journal")).toBe(true)
      expect(isCalendarNoteId("journal/2025-W04", "journal")).toBe(true)
    })

    it("returns false for date notes at root when directory is configured", () => {
      expect(isCalendarNoteId("2025-01-26", "journal")).toBe(false)
      expect(isCalendarNoteId("2025-W04", "journal")).toBe(false)
    })

    it("returns false for date notes in wrong directory", () => {
      expect(isCalendarNoteId("other/2025-01-26", "journal")).toBe(false)
      expect(isCalendarNoteId("notes/daily/2025-W04", "journal")).toBe(false)
    })

    it("handles nested directory paths", () => {
      expect(isCalendarNoteId("notes/daily/2025-01-26", "notes/daily")).toBe(true)
      expect(isCalendarNoteId("notes/2025-01-26", "notes/daily")).toBe(false)
    })
  })
})

describe("getCalendarNoteBasename", () => {
  it("returns the date/week part from a simple ID", () => {
    expect(getCalendarNoteBasename("2025-01-26")).toBe("2025-01-26")
    expect(getCalendarNoteBasename("2025-W04")).toBe("2025-W04")
  })

  it("returns the date/week part from a path ID", () => {
    expect(getCalendarNoteBasename("journal/2025-01-26")).toBe("2025-01-26")
    expect(getCalendarNoteBasename("notes/daily/2025-W04")).toBe("2025-W04")
  })
})

describe("buildCalendarNoteId", () => {
  it("returns the date string when no directory is configured", () => {
    expect(buildCalendarNoteId("2025-01-26", "")).toBe("2025-01-26")
    expect(buildCalendarNoteId("2025-W04", "")).toBe("2025-W04")
  })

  it("prepends directory when configured", () => {
    expect(buildCalendarNoteId("2025-01-26", "journal")).toBe("journal/2025-01-26")
    expect(buildCalendarNoteId("2025-W04", "daily")).toBe("daily/2025-W04")
    expect(buildCalendarNoteId("2025-01-26", "notes/calendar")).toBe("notes/calendar/2025-01-26")
  })
})
