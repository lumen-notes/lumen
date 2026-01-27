import { z } from "zod"
import { isValidDateString, isValidWeekString } from "./date"

// Schema for the config stored in .lumen/config.json
export const configSchema = z.object({
  // Directory for calendar notes (daily/weekly). Empty string or undefined means repo root.
  calendarNotesDir: z.string().optional(),
})

export type Config = z.infer<typeof configSchema>

export const DEFAULT_CONFIG: Config = {
  calendarNotesDir: undefined,
}

export const CONFIG_FILE_PATH = ".lumen/config.json"

/** Parse config from raw JSON string */
export function parseConfigFromJson(json: string): Config {
  try {
    const parsed = JSON.parse(json)
    const result = configSchema.safeParse(parsed)
    if (result.success) {
      return result.data
    }
    console.warn("Invalid config schema:", result.error)
    return DEFAULT_CONFIG
  } catch (error) {
    console.warn("Failed to parse config JSON:", error)
    return DEFAULT_CONFIG
  }
}

/** Serialize config to JSON string */
export function serializeConfig(config: Config): string {
  return JSON.stringify(config, null, 2)
}

/**
 * Normalize a directory path:
 * - Remove leading/trailing slashes
 * - Return empty string for root
 */
export function normalizeDirectoryPath(path: string | undefined): string {
  if (!path) return ""
  return path.replace(/^\/+|\/+$/g, "")
}

/**
 * Check if a note ID represents a calendar note (daily or weekly).
 * Checks the basename (last path segment) for date/week patterns.
 *
 * When calendarNotesDir is provided:
 * - If empty string: note must be at root (no path separator)
 * - If non-empty: note must be inside that directory
 * When calendarNotesDir is undefined, only checks the basename pattern.
 */
export function isCalendarNoteId(noteId: string, calendarNotesDir?: string): boolean {
  const basename = noteId.split("/").pop() || noteId
  const hasCalendarBasename = isValidDateString(basename) || isValidWeekString(basename)

  if (!hasCalendarBasename) {
    return false
  }

  // If no directory config provided, just check the basename
  if (calendarNotesDir === undefined) {
    return true
  }

  // Check if the note is in the correct directory
  if (calendarNotesDir === "") {
    // No directory configured - note must be at root (no slashes)
    return !noteId.includes("/")
  }

  // Directory is configured - note must be inside it
  const expectedPrefix = `${calendarNotesDir}/`
  return noteId.startsWith(expectedPrefix) && noteId.slice(expectedPrefix.length) === basename
}

/**
 * Get the basename (date/week part) from a calendar note ID.
 * e.g., "journal/2026-01-26" -> "2026-01-26"
 */
export function getCalendarNoteBasename(noteId: string): string {
  return noteId.split("/").pop() || noteId
}

/**
 * Build a calendar note ID with the configured directory.
 * e.g., ("2026-01-26", "journal") -> "journal/2026-01-26"
 */
export function buildCalendarNoteId(dateOrWeek: string, calendarNotesDir: string): string {
  if (calendarNotesDir) {
    return `${calendarNotesDir}/${dateOrWeek}`
  }
  return dateOrWeek
}
