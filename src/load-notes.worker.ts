import { NoteId } from "./types"
import { parseNoteBody } from "./utils/parse-note-body"

const FILENAME_REGEX = /^\d+\.md$/

type MessagePayload = {
  directoryHandle: FileSystemDirectoryHandle
}

self.onmessage = async (event: MessageEvent<MessagePayload>) => {
  // Start timer
  console.time("loadNotes")

  const directoryHandle = event.data.directoryHandle
  const data: ReturnType<typeof parseFile>[] = []
  const notes: Record<NoteId, string> = {}
  const backlinks: Record<NoteId, NoteId[]> = {}
  const tags: Record<string, NoteId[]> = {}
  const dates: Record<string, NoteId[]> = {}

  // Parse every note file in the directory
  for await (const [name, handle] of directoryHandle.entries()) {
    // Only load markdown files with numeric names (example: "123.md")
    if (handle.kind === "file" && FILENAME_REGEX.test(name)) {
      data.push(handle.getFile().then(parseFile))
    }
  }

  for (const { id, body, noteLinks, tagLinks, dateLinks } of await Promise.all(data)) {
    notes[id] = body

    for (const noteLink of noteLinks) {
      push(backlinks, noteLink, id)
    }

    for (const tagLink of tagLinks) {
      push(tags, tagLink, id)
    }

    for (const dateLink of dateLinks) {
      push(dates, dateLink, id)
    }
  }

  // End timer
  console.timeEnd("loadNotes")

  self.postMessage({ notes, backlinks, tags, dates })
}

/** Extracts metadata from a note file */
async function parseFile(file: File) {
  if (!FILENAME_REGEX.test(file.name)) {
    throw new Error(`Invalid note filename: ${file.name}`)
  }

  const id = file.name.replace(/\.md$/, "")
  const body = await file.text()

  return { id, body, ...parseNoteBody(body) }
}

/**
 * Pushes a value to an array in an object.
 * If the array doesn't exist, this function creates it.
 */
function push<Key extends string | number, Value>(
  obj: Record<Key, Value[]>,
  property: Key,
  value: Value,
) {
  const list = obj[property] ? obj[property] : (obj[property] = [])
  list.push(value)
}
