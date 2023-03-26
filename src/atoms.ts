import { atomWithStorage } from "jotai/utils"
import { NoteId, Note } from "./types"
import { parseNote } from "./utils/parse-note"
import { atom } from "jotai"
import { Searcher } from "fast-fuzzy"

// -----------------------------------------------------------------------------
// Notes
// -----------------------------------------------------------------------------

export const rawNotesAtom = atomWithStorage<Record<NoteId, string>>("raw_notes", {
  "1": "---\nhello: world\n---\n\n Note 1",
  "2": "# Note 2",
})

export const noteCountAtom = atom((get) => {
  const rawNotes = get(rawNotesAtom)
  return Object.keys(rawNotes).length
})

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

export const notesAtom = atom<Record<NoteId, Note>>((get) => {
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
      // Skip if the source and target are the same
      if (sourceId === targetId) continue

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
    return parseInt(b[0]) - parseInt(a[0])
  })
})

export const noteSearcherAtom = atom((get) => {
  const sortedNoteEntries = get(sortedNoteEntriesAtom)
  return new Searcher(sortedNoteEntries, {
    keySelector: ([id, note]) => [note.title, note.rawBody],
    threshold: 0.8,
  })
})

// -----------------------------------------------------------------------------
// Tags
// -----------------------------------------------------------------------------

export const tagsAtom = atom<Record<string, NoteId[]>>((get) => {
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

export const datesAtom = atom<Record<string, NoteId[]>>((get) => {
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
