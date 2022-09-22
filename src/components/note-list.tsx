import { useActor } from "@xstate/react"
import { Searcher } from "fast-fuzzy"
import React from "react"
import { useInView } from "react-intersection-observer"
import { z } from "zod"
import { GlobalStateContext, NoteId } from "../global-state"
import { pluralize } from "../utils/pluralize"
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

  const deferredQuery = React.useDeferredValue(query)

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

  const searchResults = React.useMemo(() => {
    return searcher.search(deferredQuery).map(([id]) => id)
  }, [deferredQuery, searcher])

  // Show the search results if the user has typed something, otherwise show all notes
  const items = deferredQuery ? searchResults : sortedIds

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10)

  const [bottomRef, bottomInView] = useInView()

  React.useEffect(() => {
    if (bottomInView) {
      // Render 10 more notes when the user scrolls to the bottom of the list
      setNumVisibleNotes((num) => Math.min(num + 10, items.length))
    }
  }, [bottomInView, items.length])

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SearchInput
            placeholder={`Search ${pluralize(ids.length, "note")}`}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)

              // Reset the number of visible notes when the user starts typing
              setNumVisibleNotes(10)
            }}
          />
          {deferredQuery ? (
            <span className="text-xs text-text-muted">
              {pluralize(searchResults.length, "result")}
            </span>
          ) : null}
        </div>
        {items.slice(0, numVisibleNotes).map((id) => (
          <NoteCard key={id} id={id} />
        ))}
      </div>
      {items.length > numVisibleNotes ? <div ref={bottomRef} /> : null}
    </div>
  )
}
