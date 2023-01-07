import { Note, NoteId } from "./types"
import { parseNoteBody } from "./utils/parse-note-body"

// const FILENAME_REGEX = /^\d+\.md$/

type MessagePayload = {
  directoryHandle: FileSystemDirectoryHandle
}

self.onmessage = async (event: MessageEvent<MessagePayload>) => {
  // Start timer
  console.time("loadNotes")

  // Fetch notes from GitHub repository
  const json = await fetch(
    "https://api.github.com/repos/colebemis/notes/contents/.lumen/notes.json",
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
      },
    },
  ).then((response) => response.json())

  const data: Record<string, string> = JSON.parse(atob(json.content))
  const parsedData = Object.entries(data).map(([id, body]) => ({
    id,
    body,
    ...parseNoteBody(body),
  }))
  const notes: Record<NoteId, Note> = {}
  const backlinks: Record<NoteId, NoteId[]> = {}
  const tags: Record<string, NoteId[]> = {}
  const dates: Record<string, NoteId[]> = {}

  for (const { id, title, body, noteLinks, tagLinks, dateLinks } of parsedData) {
    notes[id] = { title, body }

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
// async function parseFile(file: File) {
//   if (!FILENAME_REGEX.test(file.name)) {
//     throw new Error(`Invalid note filename: ${file.name}`)
//   }

//   const id = file.name.replace(/\.md$/, "")
//   const body = await file.text()

//   return { id, body, ...parseNoteBody(body) }
// }

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
