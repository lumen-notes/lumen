import { z } from "zod"
import { Context } from "./global-state"
import { Note, NoteId } from "./types"
import { deleteFile, readFile, writeFile } from "./utils/file-system"
import { parseNoteBody } from "./utils/parse-note-body"

const timerLabel = "Sync notes"

self.onmessage = async (event: MessageEvent<Context>) => {
  try {
    console.time(timerLabel)

    // Push unsynced notes to GitHub
    for (const id of event.data.unsyncedNotes.upserted) {
      writeFile({ context: event.data, path: `${id}.md`, content: event.data.notes[id].body })
    }

    for (const id of event.data.unsyncedNotes.deleted) {
      deleteFile({ context: event.data, path: `${id}.md` })
    }

    const latestSha = await fetchLatestSha(event.data)

    // Don't load notes if the SHA hasn't changed
    if (latestSha === event.data.sha) {
      console.timeEnd(timerLabel)
      console.log(`SHA: ${latestSha} (unchanged)`)
      self.postMessage({
        // Clear unsynced notes
        unsyncedNotes: { upserted: new Set<string>(), deleted: new Set<string>() },
        // Clear error
        error: "",
      })
      return
    }

    // Fetch note data from GitHub
    // TODO: Handle case when .lumen/notes.json doesn't exist
    const file = await readFile({ context: event.data, path: ".lumen/notes.json" })
    const schema = z.record(z.string())
    const noteData = schema.parse(JSON.parse(await file.text()))
    const parsedNoteData = Object.entries(noteData).map(([id, body]) => {
      const isSynced = !event.data.unsyncedNotes.upserted.has(id)
      // If the note is synced, use the body from GitHub
      // Otherwise, use the body stored in context
      const updatedBody = isSynced ? body : event.data.notes[id].body
      return {
        id,
        body: updatedBody,
        ...parseNoteBody(updatedBody),
      }
    })

    // Create a map of notes, backlinks, tags, and dates
    const notes: Record<NoteId, Note> = {}
    const backlinks: Record<NoteId, NoteId[]> = {}
    const tags: Record<string, NoteId[]> = {}
    const dates: Record<string, NoteId[]> = {}

    // Copy the parsed data into the maps
    for (const { id, title, body, noteLinks, tagLinks, dateLinks } of parsedNoteData) {
      // Skip deleted notes
      if (event.data.unsyncedNotes.deleted.has(id)) {
        continue
      }

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

    // Log the time it took to sync notes
    console.timeEnd(timerLabel)
    console.log(`SHA: ${latestSha} (changed)`)

    // Send the notes, backlinks, tags, and dates to the main thread
    self.postMessage({
      sha: latestSha,
      notes,
      backlinks,
      tags,
      dates,
      // Clear unsynced notes
      unsyncedNotes: { upserted: new Set<string>(), deleted: new Set<string>() },
      // Clear error
      error: "",
    })
  } catch (error) {
    // Send the error to the main thread
    self.postMessage({
      error: (error as Error).message,
      sha: "",
      notes: {},
      backlinks: {},
      tags: {},
      dates: {},
    })
  }
}

async function fetchLatestSha(context: Context) {
  const response = await fetch(
    `https://api.github.com/repos/${context.repoOwner}/${context.repoName}/git/refs/heads/main`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${context.authToken}`,
      },
    },
  )

  if (!response.ok) {
    console.error(response)

    switch (response.status) {
      // Unauthorized
      case 401:
        throw new Error(`Invalid GitHub token`)

      // Not found
      case 404:
        throw new Error(`Repository not found: ${context.repoOwner}/${context.repoName}`)

      // Other error
      default:
        throw new Error(
          `Failed to fetch repository: ${context.repoOwner}/${context.repoName} (${response.status})`,
        )
    }
  }

  const ref = await response.json()

  return ref.object.sha
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
