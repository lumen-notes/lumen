import { useActor } from "@xstate/react"
import { Searcher } from "fast-fuzzy"
import React from "react"
import { useInView } from "react-intersection-observer"
import { z } from "zod"
import { GlobalStateContext, NoteId } from "../global-state"
import { pluralize } from "../utils/pluralize"
import { useDebounce } from "../utils/use-debounce"
import { useSearchParam } from "../utils/use-search-param"
import { NoteCard } from "./note-card"
import { SearchInput } from "./search-input"

type NoteListProps = {
  ids: NoteId[]
}

export function NoteList({ ids }: NoteListProps) {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  const [query, setQuery] = useSearchParam("q", {
    defaultValue: "",
    schema: z.string(),
    replace: true,
  })

  const debouncedQuery = useDebounce(query)

  // Sort notes by when they were created in descending order
  const sortedIds = React.useMemo(() => ids.sort((a, b) => parseInt(b) - parseInt(a)), [ids])

  // Create a search index
  const searcher = React.useMemo(() => {
    const entries = sortedIds.map((id) => [id, state.context.notes[id]])
    return new Searcher(entries, {
      keySelector: ([id, body]) => body,
      threshold: 0.8,
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
    <div>
      <div className="flex flex-col gap-4">
        <SearchInput
          placeholder={`Search ${pluralize(ids.length, "note")}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {results.slice(0, numVisibleNotes).map((id) => (
          <NoteCard key={id} id={id} />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
