import { useAtomValue } from "jotai"
import React from "react"
import type { FullOptions, Searcher as FuzzySearcher } from "fast-fuzzy"
import { noteSearcherAtom, sortedNotesAtom } from "../global-state"
import { parseQuery } from "../utils/search"
import { filterNotes, sortNotes } from "../utils/search-notes"
import type { Note } from "../schema"

// Shared search routine used by both hooks
function runSearch(
  query: string,
  sortedNotes: Note[],
  noteSearcher: FuzzySearcher<Note, FullOptions<Note>>,
) {
  if (!query) return sortedNotes
  const { fuzzy, filters, sorts } = parseQuery(query)
  const results = fuzzy ? noteSearcher.search(fuzzy) : sortedNotes
  const filtered = filterNotes(results, filters)
  return sorts.length ? sortNotes(filtered, sorts) : filtered
}

export function useSearchNotes() {
  const sortedNotes = useAtomValue(sortedNotesAtom)
  const noteSearcher = useAtomValue(noteSearcherAtom)

  const searchNotes = React.useCallback(
    (query: string) => {
      return runSearch(query, sortedNotes, noteSearcher)
    },
    [sortedNotes, noteSearcher],
  )

  return searchNotes
}

// The same as useSearchNotes except the function value doesn't change when the notes change.
// This is useful for implementing note autocomplete in CodeMirror.
export function useStableSearchNotes() {
  const sortedNotes = useAtomValue(sortedNotesAtom)
  const noteSearcher = useAtomValue(noteSearcherAtom)

  const sortedNotesRef = React.useRef(sortedNotes)
  const noteSearcherRef = React.useRef(noteSearcher)

  React.useEffect(() => {
    sortedNotesRef.current = sortedNotes
  }, [sortedNotes])

  React.useEffect(() => {
    noteSearcherRef.current = noteSearcher
  }, [noteSearcher])

  const searchNotes = React.useCallback((query: string) => {
    return runSearch(query, sortedNotesRef.current, noteSearcherRef.current)
  }, [])

  return searchNotes
}
