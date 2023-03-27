import { Getter, atom, useAtom, useSetAtom } from "jotai"
import { atomWithStorage, useAtomCallback } from "jotai/utils"
import React from "react"
import { z } from "zod"
import {
  deleteNoteAtom,
  githubRepoAtom,
  githubTokenAtom,
  rawNotesAtom,
  upsertNoteAtom,
} from "../global-atoms"
import { deleteFile, getFileSha, readFile, writeFile } from "./github-fs"

// Store SHA to avoid re-fetching notes if they haven't changed
const shaAtom = atomWithStorage<string>("sha", "")

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

      if (process.env.NODE_ENV === "development" && latestSha) {
        console.log(`SHA: ${latestSha} ${sha === latestSha ? "(cached)" : "(new)"}`)
      }

      // Only fetch notes if the SHA is unknown or has changed
      if (!sha || sha !== latestSha) {
        const file = await readFile({ githubToken, githubRepo, path: ".lumen/notes.json" })
        const fileSchema = z.record(z.string())
        const rawNotes = fileSchema.parse(JSON.parse(await file.text()))
        setRawNotes(rawNotes)
        setSha(latestSha)
      }

      // Clear error
      setError(null)
    } catch (error) {
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
