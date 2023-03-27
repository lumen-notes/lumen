import { Getter, atom, useAtom, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import React from "react"
import { z } from "zod"
import {
  deleteNoteAtom,
  githubRepoAtom,
  githubTokenAtom,
  rawNotesAtom,
  upsertNoteAtom,
} from "../global-atoms"
import { deleteFile, readFile, writeFile } from "./github-fs"

const isFetchingAtom = atom(false)
const errorAtom = atom<Error | null>(null)

const githubTokenCallback = (get: Getter) => get(githubTokenAtom)
const githubRepoCallback = (get: Getter) => get(githubRepoAtom)

export const useFetchNotes = () => {
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

      const file = await readFile({ githubToken, githubRepo, path: ".lumen/notes.json" })
      const fileSchema = z.record(z.string())
      const rawNotes = fileSchema.parse(JSON.parse(await file.text()))

      setRawNotes(rawNotes)

      // Clear error
      setError(null)
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsFetching(false)
    }
  }, [getGitHubToken, getGitHubRepo, setRawNotes, setIsFetching, setError])

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
