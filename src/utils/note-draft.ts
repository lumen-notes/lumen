import { GitHubRepository, NoteId } from "../schema"

const DRAFT_PREFIX = "draft" as const
const DRAFT_DEBOUNCE_MS = 500

// Keep track of pending debounced writes per storage key so we can
// coalesce rapid updates and cancel when clearing a draft
const draftWriteTimers = new Map<string, number>()

function getNoteStorageKey({
  githubRepo,
  noteId,
}: {
  githubRepo: GitHubRepository | null
  noteId: NoteId
}) {
  if (!githubRepo) return `${DRAFT_PREFIX}::${noteId}`
  const owner = githubRepo.owner.trim().toLowerCase()
  const name = githubRepo.name.trim().toLowerCase()
  return `${DRAFT_PREFIX}:${owner}/${name}::${noteId}`
}

export function getNoteDraft({
  githubRepo,
  noteId,
}: {
  githubRepo: GitHubRepository | null
  noteId: NoteId
}) {
  if (typeof window === "undefined" || !window.localStorage) return null

  try {
    const key = getNoteStorageKey({ githubRepo, noteId })
    return window.localStorage.getItem(key)
  } catch {
    // Ignore storage errors (e.g., private mode restrictions)
    return null
  }
}

export function setNoteDraft({
  githubRepo,
  noteId,
  value,
  immediate = false,
}: {
  githubRepo: GitHubRepository | null
  noteId: NoteId
  value: string
  immediate?: boolean
}) {
  if (typeof window === "undefined" || !window.localStorage) return

  try {
    const key = getNoteStorageKey({ githubRepo, noteId })

    // Cancel any pending debounced write
    const existingTimerId = draftWriteTimers.get(key)
    if (existingTimerId !== undefined) {
      window.clearTimeout(existingTimerId)
      draftWriteTimers.delete(key)
    }

    if (immediate) {
      // Write immediately without debounce
      window.localStorage.setItem(key, value)
    } else {
      // Debounce writes to reduce pressure on localStorage
      const timeoutId = window.setTimeout(() => {
        try {
          window.localStorage.setItem(key, value)
        } catch {
          // Ignore storage errors (e.g., private mode restrictions)
        } finally {
          draftWriteTimers.delete(key)
        }
      }, DRAFT_DEBOUNCE_MS)
      draftWriteTimers.set(key, timeoutId)
    }
  } catch {
    // Ignore storage errors (e.g., private mode restrictions)
  }
}

export function clearNoteDraft({
  githubRepo,
  noteId,
}: {
  githubRepo: GitHubRepository | null
  noteId: NoteId
}) {
  if (typeof window === "undefined" || !window.localStorage) return

  try {
    const key = getNoteStorageKey({ githubRepo, noteId })
    // Cancel any pending debounced write for this key to avoid
    // re-creating the draft after it's been cleared (e.g., after save)
    const existingTimerId = draftWriteTimers.get(key)
    if (existingTimerId !== undefined) {
      window.clearTimeout(existingTimerId)
      draftWriteTimers.delete(key)
    }
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage errors (e.g., private mode restrictions)
  }
}
