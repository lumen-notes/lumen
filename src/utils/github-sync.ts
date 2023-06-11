import { Getter, atom, useAtom, useSetAtom } from "jotai"
import { atomWithStorage, useAtomCallback } from "jotai/utils"
import React from "react"
import { z } from "zod"
import {
  deleteNoteAtom,
  githubRepoAtom,
  githubTokenAtom,
  notesAtom,
  rawNotesAtom,
  upsertNoteAtom,
} from "../global-atoms"
import { deleteFile, getFileSha, readFile, writeFile, writeFiles } from "./github-fs"

// Store SHA to avoid re-fetching notes if the SHA hasn't changed
const shaAtom = atomWithStorage<string | null>("sha", null)

const isFetchingAtom = atom(false)
const errorAtom = atom<Error | null>(null)

const githubTokenCallback = (get: Getter) => get(githubTokenAtom)
const githubRepoCallback = (get: Getter) => get(githubRepoAtom)

export const useFetchNotes = () => {
  // HACK: getGitHubToken() returns an empty string if the atom is not initialized
  useAtom(githubTokenAtom)

  const [sha, setSha] = useAtom(shaAtom)
  const getGitHubToken = useAtomCallback(githubTokenCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const setRawNotes = useSetAtom(rawNotesAtom)
  const [isFetching, setIsFetching] = useAtom(isFetchingAtom)
  const [error, setError] = useAtom(errorAtom)

  const fetchNotes = React.useCallback(async () => {
    const githubToken = getGitHubToken()
    const githubRepo = getGitHubRepo()
    if (!githubRepo) return

    try {
      setIsFetching(true)

      const filePath = ".lumen/notes.json"
      const latestSha = await getFileSha({ githubToken, githubRepo, path: filePath })

      if (process.env.NODE_ENV === "development") {
        console.log(`SHA: ${latestSha} ${sha === latestSha ? "(cached)" : "(new)"}`)
      }

      // Only fetch notes if the SHA has changed
      if (!sha || sha !== latestSha) {
        const file = await readFile({ githubToken, githubRepo, path: ".lumen/notes.json" })
        const fileSchema = z.record(z.string())
        const rawNotes = fileSchema.parse(JSON.parse(file))

        setRawNotes(rawNotes)
        setSha(latestSha)
      }

      // Clear error
      setError(null)
    } catch (error) {
      console.error(error)
      setError(error as Error)
    } finally {
      setIsFetching(false)
    }
  }, [sha, getGitHubToken, getGitHubRepo, setRawNotes, setSha, setIsFetching, setError])

  return { fetchNotes, isFetching, error }
}

export function useUpsertNote() {
  const getGitHubToken = useAtomCallback(githubTokenCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const upsertNote = useSetAtom(upsertNoteAtom)

  return React.useCallback(
    async ({ id, rawBody }: { id: string; rawBody: string }) => {
      // Update state
      upsertNote({ id, rawBody })

      // Push to GitHub
      try {
        const githubToken = getGitHubToken()
        const githubRepo = getGitHubRepo()
        if (!githubRepo) return

        await writeFile({ githubToken, githubRepo, path: `${id}.md`, content: rawBody })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [upsertNote, getGitHubToken, getGitHubRepo],
  )
}

export function useDeleteNote() {
  const getGitHubToken = useAtomCallback(githubTokenCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const deleteNote = useSetAtom(deleteNoteAtom)

  return React.useCallback(
    async (id: string) => {
      // Update state
      deleteNote(id)

      // Push to GitHub
      try {
        const githubToken = getGitHubToken()
        const githubRepo = getGitHubRepo()
        if (!githubRepo) return

        await deleteFile({ githubToken, githubRepo, path: `${id}.md` })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [deleteNote, getGitHubToken, getGitHubRepo],
  )
}

const notesCallback = (get: Getter) => get(notesAtom)

export function useRenameTag() {
  const getGitHubToken = useAtomCallback(githubTokenCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const getNotes = useAtomCallback(notesCallback)
  const setRawNotes = useSetAtom(rawNotesAtom)

  return React.useCallback(
    async (oldName: string, newName: string) => {
      const notes = getNotes()

      // Notes that contain the old tag
      const filteredNotes = filterObject(notes, (note) => {
        return note.tags.includes(oldName)
      })

      // Find and replace the old tag with the new tag
      const updatedRawNotes = mapObject(filteredNotes, (note, id) => {
        return [id, note.rawBody.replace(`#${oldName}`, `#${newName}`)]
      })

      // Update state
      setRawNotes((rawNotes) => ({ ...rawNotes, ...updatedRawNotes }))

      // Push to GitHub
      try {
        const githubToken = getGitHubToken()
        const githubRepo = getGitHubRepo()
        if (!githubRepo) return

        const files = mapObject(updatedRawNotes, (rawBody, id) => {
          return [`${id}.md`, rawBody]
        })

        await writeFiles({
          githubToken,
          githubRepo,
          files,
          commitMessage: `Rename tag #${oldName} to #${newName}`,
        })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [getNotes, setRawNotes, getGitHubToken, getGitHubRepo],
  )
}

function filterObject<T>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => boolean,
): Record<string, T> {
  const result: Record<string, T> = {}
  for (const key in obj) {
    if (fn(obj[key], key)) {
      result[key] = obj[key]
    }
  }
  return result
}

function mapObject<T, U extends string | number | symbol, V>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => [U, V],
): Record<U, V> {
  const result: Record<U, V> = {} as Record<U, V>
  for (const key in obj) {
    const [newKey, newValue] = fn(obj[key], key)
    result[newKey] = newValue
  }
  return result
}
