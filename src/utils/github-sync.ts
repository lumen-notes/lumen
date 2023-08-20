import { Getter, atom, useAtom, useSetAtom } from "jotai"
import { atomWithStorage, useAtomCallback } from "jotai/utils"
import React from "react"
import { z } from "zod"
import {
  deleteNoteAtom,
  githubRepoAtom,
  githubUserAtom,
  notesAtom,
  rawNotesAtom,
  upsertNoteAtom,
} from "../global-atoms"
import { deleteFile, getFileSha, readFile, writeFile, writeFiles } from "./github-fs"

// Store SHA to avoid re-fetching notes if the SHA hasn't changed
export const shaAtom = atomWithStorage<string | null>("sha", null)

const isFetchingAtom = atom(false)
const errorAtom = atom<Error | null>(null)

const githubUserCallback = (get: Getter) => get(githubUserAtom)
const githubRepoCallback = (get: Getter) => get(githubRepoAtom)

export const useFetchNotes = () => {
  // HACK: getGitHubUser() returns an empty string if the atom is not initialized
  useAtom(githubUserAtom)

  const [sha, setSha] = useAtom(shaAtom)
  const getGitHubUser = useAtomCallback(githubUserCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const setRawNotes = useSetAtom(rawNotesAtom)
  const [isFetching, setIsFetching] = useAtom(isFetchingAtom)
  const [error, setError] = useAtom(errorAtom)

  const fetchNotes = React.useCallback(async () => {
    const githubUser = getGitHubUser()
    const githubRepo = getGitHubRepo()
    if (!githubUser || !githubRepo) return

    try {
      setIsFetching(true)

      const filePath = ".lumen/notes.json"
      const latestSha = await getFileSha({
        githubToken: githubUser.token,
        githubRepo,
        path: filePath,
      })

      if (process.env.NODE_ENV === "development") {
        console.log(`SHA: ${latestSha} ${sha === latestSha ? "(cached)" : "(new)"}`)
      }

      // Only fetch notes if the SHA has changed
      if (!sha || sha !== latestSha) {
        const file = await readFile({
          githubToken: githubUser.token,
          githubRepo,
          path: ".lumen/notes.json",
        })
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

      // Clear notes
      setRawNotes({})
      setSha(null)
    } finally {
      setIsFetching(false)
    }
  }, [sha, getGitHubUser, getGitHubRepo, setRawNotes, setSha, setIsFetching, setError])

  return { fetchNotes, isFetching, error }
}

export function useUpsertNote() {
  const getGitHubUser = useAtomCallback(githubUserCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const upsertNote = useSetAtom(upsertNoteAtom)

  return React.useCallback(
    async ({ id, rawBody }: { id: string; rawBody: string }) => {
      // Update state
      upsertNote({ id, rawBody })

      // Push to GitHub
      try {
        const githubUser = getGitHubUser()
        const githubRepo = getGitHubRepo()
        if (!githubUser || !githubRepo) return

        await writeFile({
          githubToken: githubUser.token,
          githubRepo,
          path: `${id}.md`,
          content: rawBody,
        })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [upsertNote, getGitHubUser, getGitHubRepo],
  )
}

export function useDeleteNote() {
  const getGitHubUser = useAtomCallback(githubUserCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const deleteNote = useSetAtom(deleteNoteAtom)

  return React.useCallback(
    async (id: string) => {
      // Update state
      deleteNote(id)

      // Push to GitHub
      try {
        const githubUser = getGitHubUser()
        const githubRepo = getGitHubRepo()
        if (!githubUser || !githubRepo) return

        await deleteFile({ githubToken: githubUser.token, githubRepo, path: `${id}.md` })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [deleteNote, getGitHubUser, getGitHubRepo],
  )
}

const notesCallback = (get: Getter) => get(notesAtom)

export function useRenameTag() {
  const getGitHubUser = useAtomCallback(githubUserCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const getNotes = useAtomCallback(notesCallback)
  const setRawNotes = useSetAtom(rawNotesAtom)

  return React.useCallback(
    async (oldName: string, newName: string) => {
      const notes = getNotes()

      const updatedRawNotes = [...notes.values()]
        // Notes that contain the old tag
        .filter((note) => note.tags.includes(oldName))
        .reduce<Record<string, string>>((updatedRawNotes, note) => {
          // Find and replace the old tag with the new tag
          updatedRawNotes[note.id] = note.rawBody.replace(`#${oldName}`, `#${newName}`)
          return updatedRawNotes
        }, {})

      // Update state
      setRawNotes((rawNotes) => ({ ...rawNotes, ...updatedRawNotes }))

      // Push to GitHub
      try {
        const githubUser = getGitHubUser()
        const githubRepo = getGitHubRepo()
        if (!githubUser || !githubRepo) return

        const files = mapObject(updatedRawNotes, (rawBody, id) => {
          return [`${id}.md`, rawBody]
        })

        await writeFiles({
          githubToken: githubUser.token,
          githubRepo,
          files,
          commitMessage: `Rename tag #${oldName} to #${newName}`,
        })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [getNotes, setRawNotes, getGitHubUser, getGitHubRepo],
  )
}

export function useDeleteTag() {
  const getGitHubUser = useAtomCallback(githubUserCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const getNotes = useAtomCallback(notesCallback)
  const setRawNotes = useSetAtom(rawNotesAtom)

  return React.useCallback(
    async (tagName: string) => {
      const notes = getNotes()

      // Regex to match the tag and its children
      const tagRegex = new RegExp(`#${tagName}\\b(\\/[\\w\\-_\\d]*)*`, "g")

      const updatedRawNotes = [...notes.values()]
        // Notes that contain the tag to be deleted
        .filter((note) => note.tags.includes(tagName))
        .reduce<Record<string, string>>((updatedRawNotes, note) => {
          // Find and replace the tag with an empty string
          updatedRawNotes[note.id] = note.rawBody.replace(tagRegex, ``)
          return updatedRawNotes
        }, {})

      // Update state
      setRawNotes((rawNotes) => ({ ...rawNotes, ...updatedRawNotes }))

      // Push to GitHub
      try {
        const githubUser = getGitHubUser()
        const githubRepo = getGitHubRepo()
        if (!githubUser || !githubRepo) return

        const files = mapObject(updatedRawNotes, (rawBody, id) => {
          return [`${id}.md`, rawBody]
        })

        await writeFiles({
          githubToken: githubUser.token,
          githubRepo,
          files,
          commitMessage: `Delete tag #${tagName}`,
        })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [getNotes, setRawNotes, getGitHubUser, getGitHubRepo],
  )
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
