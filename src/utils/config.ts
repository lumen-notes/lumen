import { z } from "zod"
import { isValidDateString, isValidWeekString } from "./date"

// Schema for the config stored in .lumen/config.json
export const configSchema = z.object({
  // Directory for calendar notes (daily/weekly). Empty string or undefined means repo root.
  calendarNotesDirectory: z.string().optional(),
})

export type Config = z.infer<typeof configSchema>

export const DEFAULT_CONFIG: Config = {
  calendarNotesDirectory: undefined,
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

/** Check if a note ID represents a calendar note (daily or weekly) */
export function isCalendarNoteId(noteId: string): boolean {
  return isValidDateString(noteId) || isValidWeekString(noteId)
}

/**
 * Get the filepath for a note ID, considering the calendar notes directory.
 * For daily/weekly notes, prepends the calendar notes directory.
 * For other notes, returns the ID as-is.
 */
export function getNoteFilepath(
  noteId: string,
  calendarNotesDir: string
): string {
  if (isCalendarNoteId(noteId) && calendarNotesDir) {
    return `${calendarNotesDir}/${noteId}.md`
  }
  return `${noteId}.md`
}

/**
 * Get the note ID from a filepath, considering the calendar notes directory.
 * If the filepath is in the calendar notes directory and the filename looks like
 * a calendar note (date or week), strip the directory prefix.
 */
export function getNoteIdFromFilepath(
  filepath: string,
  calendarNotesDir: string
): string {
  // Remove .md extension
  const pathWithoutExt = filepath.replace(/\.md$/, "")
  
  if (!calendarNotesDir) {
    return pathWithoutExt
  }
  
  // Check if the file is in the calendar notes directory
  const prefix = `${calendarNotesDir}/`
  if (pathWithoutExt.startsWith(prefix)) {
    const filename = pathWithoutExt.slice(prefix.length)
    // Only strip the prefix if the filename doesn't contain more path segments
    // (i.e., it's directly in the calendar notes directory, not a subdirectory)
    // and if the filename is a valid calendar note ID
    if (!filename.includes("/") && isCalendarNoteId(filename)) {
      return filename
    }
  }
  
  return pathWithoutExt
}
