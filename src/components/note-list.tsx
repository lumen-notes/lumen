import { Searcher } from "fast-fuzzy"
import React from "react"
import { useInView } from "react-intersection-observer"
import { z } from "zod"
import { GlobalStateContext } from "../global-state.machine"
import { Note, NoteId } from "../types"
import { pluralize } from "../utils/pluralize"
import { useSearchParam } from "../utils/use-search-param"
import { NoteCard } from "./note-card"
import { SearchInput } from "./search-input"

type NoteListProps = {
  ids: NoteId[]
  disableSort?: boolean
}

export function NoteList({ ids, disableSort }: NoteListProps) {
  const [state] = GlobalStateContext.useActor()
  const [searcher, setSearcher] = React.useState<Searcher<
    [string, Note],
    Record<string, unknown>
  > | null>(null)

  const [query, setQuery] = useSearchParam("q", {
    defaultValue: "",
    schema: z.string(),
    replace: true,
  })

  const deferredQuery = React.useDeferredValue(query)

  // Sort notes by when they were created in descending order
  const sortedIds = React.useMemo(
    () => (disableSort ? ids : ids.sort((a, b) => parseInt(b) - parseInt(a))),
    [disableSort, ids],
  )

  // Create a search index
  // We use useEffect here to avoid blocking the first render while mapping over the notes
  React.useEffect(() => {
    const entries: [string, Note][] = sortedIds
      .map((id): [string, Note] => [id, state.context.notes[id]])
      .filter(([id, note]) => note !== undefined)

    const searcher = new Searcher(entries, {
      keySelector: ([id, { body }]) => body,
      threshold: 0.8,
    })

    React.startTransition(() => {
      setSearcher(searcher)
    })
  }, [sortedIds, state.context.notes])

  const searchResults = React.useMemo(() => {
    return searcher?.search(deferredQuery).map(([id]) => id) ?? []
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
            onChange={(value) => {
              setQuery(value)

              // Reset the number of visible notes when the user starts typing
              setNumVisibleNotes(10)
            }}
          />
          {deferredQuery ? (
            <span className="text-xs text-text-secondary">
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
