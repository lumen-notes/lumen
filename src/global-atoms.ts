import { Searcher } from "fast-fuzzy"
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { GitHubRepository, GitHubUser, Note, NoteId, Template, templateSchema } from "./types"
import { parseNote } from "./utils/parse-note"
import { removeTemplateFrontmatter } from "./utils/remove-template-frontmatter"

// -----------------------------------------------------------------------------
// GitHub
// -----------------------------------------------------------------------------

export const githubUserAtom = atomWithStorage<GitHubUser | null>("github_user", null)

export const githubRepoAtom = atomWithStorage<GitHubRepository | null>("github_repo", null)

// -----------------------------------------------------------------------------
// Notes
// -----------------------------------------------------------------------------

export const rawNotesAtom = atomWithStorage<Record<NoteId, string>>("raw_notes", {})

export const upsertNoteAtom = atom(
  null,
  (get, set, { id, rawBody }: { id: NoteId; rawBody: string }) => {
    const rawNotes = get(rawNotesAtom)
    set(rawNotesAtom, { ...rawNotes, [id]: rawBody })
  },
)

export const deleteNoteAtom = atom(null, (get, set, id: NoteId) => {
  const rawNotes = get(rawNotesAtom)
  const { [id]: _, ...newRawNotes } = rawNotes
  set(rawNotesAtom, newRawNotes)
})

export const notesAtom = atom((get) => {
  const rawNotes = get(rawNotesAtom)
  const notes: Record<NoteId, Note> = {}

  // Parse notes
  for (const id in rawNotes) {
    const rawBody = rawNotes[id]
    notes[id] = { rawBody, ...parseNote(rawBody), backlinks: [] }
  }

  // Derive backlinks
  for (const sourceId in notes) {
    for (const targetId of notes[sourceId].links) {
      // Skip if the target note doesn't exist
      if (!notes[targetId]) continue

      // Skip if the source note is already a backlink
      if (notes[targetId].backlinks.includes(sourceId)) continue

      notes[targetId].backlinks.push(sourceId)
    }
  }

  return notes
})

export const sortedNoteEntriesAtom = atom((get) => {
  const notes = get(notesAtom)
  // Sort notes by when they were created in descending order
  return Object.entries(notes).sort((a, b) => {
    // Put numeric IDs first
    if (a[0].match(/^\d+$/) && !b[0].match(/^\d+$/)) {
      return -1
    } else if (!a[0].match(/^\d+$/) && b[0].match(/^\d+$/)) {
      return 1
    }

    return b[0].localeCompare(a[0])
  })
})

export const noteSearcherAtom = atom((get) => {
  const sortedNoteEntries = get(sortedNoteEntriesAtom)
  return new Searcher(sortedNoteEntries, {
    keySelector: ([id, note]) => [note.title, note.rawBody, id],
    threshold: 0.8,
  })
})

// -----------------------------------------------------------------------------
// Tags
// -----------------------------------------------------------------------------

export const tagsAtom = atom((get) => {
  const notes = get(notesAtom)
  const tags: Record<string, NoteId[]> = {}

  for (const id in notes) {
    for (const tag of notes[id].tags) {
      // If the tag doesn't exist, create it
      if (!tags[tag]) tags[tag] = []
      // If the note isn't already linked to the tag, link it
      if (!tags[tag].includes(id)) tags[tag].push(id)
    }
  }

  return tags
})

export const sortedTagEntriesAtom = atom((get) => {
  const tags = get(tagsAtom)
  // Sort tags alphabetically in ascending order
  return Object.entries(tags).sort((a, b) => {
    return a[0].localeCompare(b[0])
  })
})

export const tagSearcherAtom = atom((get) => {
  const sortedTagEntries = get(sortedTagEntriesAtom)
  return new Searcher(sortedTagEntries, {
    keySelector: ([tag]) => tag,
    threshold: 0.8,
  })
})

// -----------------------------------------------------------------------------
// Dates
// -----------------------------------------------------------------------------

export const datesAtom = atom((get) => {
  const notes = get(notesAtom)
  const dates: Record<string, NoteId[]> = {}

  for (const id in notes) {
    for (const date of notes[id].dates) {
      // If the date doesn't exist, create it
      if (!dates[date]) dates[date] = []
      // If the note isn't already linked to the date, link it
      if (!dates[date].includes(id)) dates[date].push(id)
    }
  }

  return dates
})

// -----------------------------------------------------------------------------
// Templates
// -----------------------------------------------------------------------------

export const templatesAtom = atom((get) => {
  const notes = get(notesAtom)
  const templates: Record<string, Template> = {}

  for (const id in notes) {
    const template = notes[id].frontmatter.template

    // Skip if note isn't a template
    if (!template) continue

    try {
      const parsedTemplate = templateSchema.omit({ body: true }).parse(template)

      const body = removeTemplateFrontmatter(notes[id].rawBody)

      templates[id] = { ...parsedTemplate, body }
    } catch (error) {
      // Template frontmatter didn't match the schema
      console.error(error)
    }
  }

  return templates
})
