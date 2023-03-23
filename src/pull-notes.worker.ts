import { z } from "zod"
import { Context } from "./global-state.machine"
import { Note, NoteId } from "./types"
import { readFile } from "./utils/file-system"
import { parseNoteBody } from "./utils/parse-note-body"

const timerLabel = "Pull notes"

self.onmessage = async (event: MessageEvent<Context>) => {
  try {
    console.time(timerLabel)

    const latestSha = await fetchLatestSha(event.data)

    // Don't load notes if the SHA hasn't changed
    if (latestSha === event.data.sha) {
      console.timeEnd(timerLabel)
      console.log(`SHA: ${latestSha} (unchanged)`)
      self.postMessage({
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
      return { id, body, ...parseNoteBody(body) }
    })

    // Create a map of notes, backlinks, tags, and dates
    const notes: Record<NoteId, Note> = {}
    const tags: Record<string, NoteId[]> = {}
    const dates: Record<string, NoteId[]> = {}

    // Copy the parsed data into the maps
    for (const { id, title, body, tagLinks, dateLinks, frontmatter } of parsedNoteData) {
      notes[id] = {
        title,
        body,
        tags: tagLinks,
        dates: dateLinks,
        backlinks: [],
        frontmatter,
      }

      for (const tagLink of tagLinks) {
        push(tags, tagLink, id)
      }

      for (const dateLink of dateLinks) {
        push(dates, dateLink, id)
      }
    }

    // Add backlinks to notes
    for (const { id, noteLinks } of parsedNoteData) {
      for (const noteLink of noteLinks) {
        notes[noteLink]?.backlinks.push(id)
      }
    }

    // Log the time it took to pull and parse the notes
    console.timeEnd(timerLabel)
    console.log(`SHA: ${latestSha} (changed)`)

    // Send the notes, backlinks, tags, and dates to the main thread
    self.postMessage({
      sha: latestSha,
      notes,
      tags,
      dates,
      // Clear error
      error: "",
    })
  } catch (error) {
    // Send the error to the main thread
    self.postMessage({
      error: (error as Error).message,
      sha: "",
      notes: {},
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
