import React from "react"
import { Note } from "../types"
import { GlobalStateContext } from "../global-state.machine"
import { Searcher } from "fast-fuzzy"

const SearchNotesContext = React.createContext<(query: string) => Array<[string, Note]>>(() => [])

export const SearchNotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [state] = GlobalStateContext.useActor()

  const sortedEntries = React.useMemo(() => {
    // Sort notes by when they were created in descending order
    return Object.entries(state.context.notes).sort((a, b) => {
      return parseInt(b[0]) - parseInt(a[0])
    })
  }, [state.context.notes])

  // Create a search index
  const searchIndex = React.useMemo(() => {
    return new Searcher(sortedEntries, {
      keySelector: ([id, { title, body }]) => [title, body],
      threshold: 0.8,
    })
  }, [sortedEntries])

  const searchNotes = React.useCallback(
    (query: string) => {
      // If there's no query, return all notes sorted by when they were created
      if (!query) return sortedEntries
      return searchIndex.search(query)
    },
    [sortedEntries, searchIndex],
  )

  return <SearchNotesContext.Provider value={searchNotes}>{children}</SearchNotesContext.Provider>
}

export const useSearchNotes = () => React.useContext(SearchNotesContext)
