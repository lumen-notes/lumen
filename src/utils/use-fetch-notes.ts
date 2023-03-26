import { atom, useAtom, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import React from "react"
import { z } from "zod"
import { githubRepoAtom, githubTokenAtom, rawNotesAtom } from "../global-atoms"
import { readFile } from "./file-system"

const isFetchingAtom = atom(false)
const errorAtom = atom<Error | null>(null)

export const useFetchNotes = () => {
  const getGitHubToken = useAtomCallback(React.useCallback((get) => get(githubTokenAtom), []))
  const getGitHubRepo = useAtomCallback(React.useCallback((get) => get(githubRepoAtom), []))
  const setRawNotes = useSetAtom(rawNotesAtom)
  const [isFetching, setIsFetching] = useAtom(isFetchingAtom)
  const [error, setError] = useAtom(errorAtom)

  const fetchNotes = React.useCallback(async () => {
    const githubToken = getGitHubToken()
    const githubRepo = getGitHubRepo()
    if (!githubRepo) return

    try {
      setIsFetching(true)

      // TODO: Check SHA
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
