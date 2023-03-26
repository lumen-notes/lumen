import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { githubRepoAtom, githubTokenAtom, rawNotesAtom } from "../global-atoms"
import { z } from "zod"
import React from "react"
import { readFile } from "./file-system"

const isFetchingAtom = atom(false)
const errorAtom = atom<Error | null>(null)

export const useFetchNotes = () => {
  const githubToken = useAtomValue(githubTokenAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const setRawNotes = useSetAtom(rawNotesAtom)
  const [isFetching, setIsFetching] = useAtom(isFetchingAtom)
  const [error, setError] = useAtom(errorAtom)

  const fetchNotes = React.useCallback(async () => {
    if (!githubRepo) return

    try {
      setIsFetching(true)

      // TODO: Check SHA
      const file = await readFile({ githubToken, githubRepo, path: ".lumen/notes.json" })
      const fileSchema = z.record(z.string())
      const rawNotes = fileSchema.parse(JSON.parse(await file.text()))

      setRawNotes(rawNotes)
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsFetching(false)
    }
  }, [githubToken, githubRepo, setRawNotes, setIsFetching, setError])

  return { fetchNotes, isFetching, error }
}
