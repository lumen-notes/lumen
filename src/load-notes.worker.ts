import { z } from "zod"
import { Context } from "./global-state"
import { Note, NoteId } from "./types"
import { readFile } from "./utils/file-system"
import { parseNoteBody } from "./utils/parse-note-body"

self.onmessage = async (event: MessageEvent<Context>) => {
  try {
    // Start timer
    console.time("loadNotes")

    const latestSha = await fetchLatestSha(event.data)

    // Don't load notes if the SHA hasn't changed
    if (latestSha === event.data.sha) {
      // End timer
      console.timeEnd("loadNotes")

      self.postMessage(null)
      return
    }

    // TODO: Provide helpful guidance when .lumen/notes.json doesn't exist

    // Fetch notes from GitHub
    const file = await readFile({ context: event.data, path: ".lumen/notes.json" })
    const schema = z.record(z.string())
    const data = schema.parse(JSON.parse(await file.text()))
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

    self.postMessage({ sha: latestSha, notes, backlinks, tags, dates, error: "" })
  } catch (err) {
    const error = err as Error
    self.postMessage({
      error: error.message,
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
