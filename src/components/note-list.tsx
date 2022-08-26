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

  const [searchValue, setSearchValue] = React.useState("")
  const debouncedSearchValue = useDebounce(searchValue, 300)

  const searcher = React.useMemo(() => {
    return new Searcher(Object.entries(state.context.notes), {
      keySelector: (entry) => entry[1],
    })
  }, [state.context.notes])

  // Sort notes by when they were created in descending order
  const sortedIds = React.useMemo(
    () => ids.sort((a, b) => parseInt(b) - parseInt(a)),
    [ids],
  )

  const results = React.useMemo(() => {
    if (!debouncedSearchValue) {
      return sortedIds
    }

    return searcher.search(debouncedSearchValue).map(([id]) => id)
  }, [debouncedSearchValue, sortedIds, searcher])

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
          value={searchValue}
          // TODO: Call debounced search function on change
          onChange={(event) => setSearchValue(event.target.value)}
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
function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
