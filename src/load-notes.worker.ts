import { Buffer } from "buffer"
import { z } from "zod"
import { Note, NoteId } from "./types"
import { parseNoteBody } from "./utils/parse-note-body"

type MessagePayload = {
  authToken: string
  repoOwner: string
  repoName: string
  sha: string
}

self.onmessage = async (event: MessageEvent<MessagePayload>) => {
  try {
    // Start timer
    console.time("loadNotes")

    const { authToken, repoOwner, repoName, sha } = event.data

    // TODO: Handle offline mode

    // Fetch latest commit SHA
    const refResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/main`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    if (!refResponse.ok) {
      console.error(refResponse)

      switch (refResponse.status) {
        // Unauthorized
        case 401:
          throw new Error(`Invalid GitHub token`)

        // Not found
        case 404:
          throw new Error(`Repository not found: ${repoOwner}/${repoName}`)

        // Other error
        default:
          throw new Error(
            `Failed to fetch repository: ${repoOwner}/${repoName} (${refResponse.status})`,
          )
      }
    }

    const ref = await refResponse.json()

    // Don't load notes if the SHA hasn't changed
    if (ref.object.sha === sha) {
      // End timer
      console.timeEnd("loadNotes")

      self.postMessage(null)
      return
    }

    // TODO: Handle case where .lumen/notes.json doesn't exist

    // Fetch notes from GitHub
    const file = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/.lumen/notes.json`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${authToken}`,
        },
      },
    ).then((response) => response.json())

    const schema = z.record(z.string())
    const data = schema.parse(JSON.parse(Buffer.from(file.content, "base64").toString()))
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

    self.postMessage({ sha: ref.object.sha, notes, backlinks, tags, dates, error: "" })
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
