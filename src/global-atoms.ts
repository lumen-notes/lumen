import { Searcher } from "fast-fuzzy"
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { GitHubRepository, GitHubUser, Note, NoteId, Task, Template, templateSchema } from "./types"
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
  const notes: Map<NoteId, Note> = new Map()

  // Parse notes
  for (const id in rawNotes) {
    const rawBody = rawNotes[id]
    notes.set(id, { id, rawBody, ...parseNote(id, rawBody), backlinks: [] })
  }

  // Derive backlinks
  for (const sourceId in notes) {
    for (const targetId of notes.get(sourceId)?.links ?? []) {
      // Skip if the target note doesn't exist
      if (!notes.has(targetId)) continue

      // Skip if the source note is already a backlink
      if (notes.get(targetId)?.backlinks.includes(sourceId)) continue

      notes.get(targetId)?.backlinks.push(sourceId)
    }
  }

  return notes
})

export const sortedNotesAtom = atom((get) => {
  const notes = get(notesAtom)

  // Sort notes by when they were created in descending order
  return [...notes.values()].sort((a, b) => {
    // Put numeric IDs first
    if (a.id.match(/^\d+$/) && !b.id.match(/^\d+$/)) {
      return -1
    } else if (!a.id.match(/^\d+$/) && b.id.match(/^\d+$/)) {
      return 1
    }

    return b.id.localeCompare(a.id)
  })
})

export const noteSearcherAtom = atom((get) => {
  const sortedNotes = get(sortedNotesAtom)
  return new Searcher(sortedNotes, {
    keySelector: (note) => [note.title, note.rawBody, note.id],
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
    for (const tag of notes.get(id)?.tags ?? []) {
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

  for (const { id, dates: notesDates } of notes.values()) {
    for (const date of notesDates) {
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

  for (const { id, rawBody, frontmatter } of notes.values()) {
    const template = frontmatter["template"]

    // Skip if note isn't a template
    if (!template) continue

    try {
      const parsedTemplate = templateSchema.omit({ body: true }).parse(template)

      const body = removeTemplateFrontmatter(rawBody)

      templates[id] = { ...parsedTemplate, body }
    } catch (error) {
      // Template frontmatter didn't match the schema
      console.error(error)
    }
  }

  return templates
})

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------

export const tasksAtom = atom((get) => {
  const sortedNotes = get(sortedNotesAtom)
  const tasks: Task[] = []

  for (const { tasks: notesTasks } of sortedNotes) {
    for (const task of notesTasks) {
      tasks.push(task)
    }
  }

  return tasks
})

export const taskSearcherAtom = atom((get) => {
  const tasks = get(tasksAtom)
  return new Searcher(tasks, {
    keySelector: (task) => [task.title, task.rawBody],
    threshold: 0.8,
  })
})
