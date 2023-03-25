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

    // Create a map of notes, tags, and dates
    const notesMap: Record<NoteId, Note> = {}
    const tagsMap: Record<string, NoteId[]> = {}
    const datesMap: Record<string, NoteId[]> = {}

    // Copy the parsed data into the maps
    for (const [id, body] of Object.entries(noteData)) {
      const { title, tags, dates, links, frontmatter } = parseNoteBody(body)

      notesMap[id] = {
        title,
        body,
        tags,
        dates,
        links,
        backlinks: [],
        frontmatter,
      }

      for (const tag of tags) {
        push(tagsMap, tag, id)
      }

      for (const date of dates) {
        push(datesMap, date, id)
      }
    }

    // Add backlinks to notes
    for (const [id, { links }] of Object.entries(notesMap)) {
      for (const link of links) {
        notesMap[link]?.backlinks.push(id)
      }
    }

    // Log the time it took to pull and parse the notes
    console.timeEnd(timerLabel)
    console.log(`SHA: ${latestSha} (changed)`)

    // Send the notes, backlinks, tags, and dates to the main thread
    self.postMessage({
      sha: latestSha,
      notes: notesMap,
      tags: tagsMap,
      dates: datesMap,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = (await response.json()) as any

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
