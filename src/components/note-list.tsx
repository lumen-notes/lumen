import { useActor } from "@xstate/react"
import { Searcher } from "fast-fuzzy"
import React from "react"
import { useInView } from "react-intersection-observer"
import { GlobalStateContext, NoteId } from "../global-state"
import { pluralize } from "../utils/pluralize"
import { Card } from "./card"
import { NoteCard } from "./note-card"

type NoteListProps = {
  ids: NoteId[]
}

export function NoteList({ ids }: NoteListProps) {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  const [query, setQuery] = React.useState("")
  const debouncedQuery = useDebounce(query)

  // Sort notes by when they were created in descending order
  const sortedIds = React.useMemo(
    () => ids.sort((a, b) => parseInt(b) - parseInt(a)),
    [ids],
  )

  // Create a search index
  const searcher = React.useMemo(() => {
    const entries = sortedIds.map((id) => [id, state.context.notes[id]])
    return new Searcher(entries, {
      keySelector: (entry) => entry[1],
    })
  }, [sortedIds, state.context.notes])

  const results = React.useMemo(() => {
    if (!debouncedQuery) {
      return sortedIds
    }

    return searcher.search(debouncedQuery).map(([id]) => id)
  }, [debouncedQuery, sortedIds, searcher])

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10)

  const [bottomRef, bottomInView] = useInView()

  React.useEffect(() => {
    if (bottomInView) {
      // Render 10 more notes when the user scrolls to the bottom of the list
      setNumVisibleNotes((num) => Math.min(num + 10, results.length))
    }
  }, [bottomInView, results.length])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <input
          className="w-full rounded-lg bg-transparent px-4 py-3 placeholder:text-text-placeholder"
          type="search"
          placeholder={`Search ${pluralize(ids.length, "note")}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Card>
      {results.slice(0, numVisibleNotes).map((id) => (
        <NoteCard key={id} id={id} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

// Copied from https://usehooks-ts.com/react-hook/use-debounce
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
