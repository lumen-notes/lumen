import React from "react"
import { useInView } from "react-intersection-observer"
import { z } from "zod"
import { NoteId } from "../types"
import { pluralize } from "../utils/pluralize"
import { useSearchParam } from "../utils/use-search-param"
import { NoteCard } from "./note-card"
import { SearchInput } from "./search-input"
import { useSearchNotes } from "./search-notes"

type NoteListProps = {
  ids: NoteId[]
  disableSort?: boolean
}

export function NoteList({ ids, disableSort }: NoteListProps) {
  const searchNotes = useSearchNotes()

  const [query, setQuery] = useSearchParam("q", {
    defaultValue: "",
    schema: z.string(),
    replace: true,
  })

  const deferredQuery = React.useDeferredValue(query)

  const searchResults = React.useMemo(() => {
    return searchNotes(deferredQuery)
  }, [searchNotes, deferredQuery])

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10)

  const [bottomRef, bottomInView] = useInView()

  React.useEffect(() => {
    if (bottomInView) {
      // Render 10 more notes when the user scrolls to the bottom of the list
      setNumVisibleNotes((num) => Math.min(num + 10, searchResults.length))
    }
  }, [bottomInView, searchResults.length])

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SearchInput
            placeholder="Search notes"
            value={query}
            onChange={(value) => {
              setQuery(value)

              // Reset the number of visible notes when the user starts typing
              setNumVisibleNotes(10)
            }}
          />
          {deferredQuery ? (
            <span className="text-sm text-text-secondary">
              {pluralize(searchResults.length, "result")}
            </span>
          ) : null}
        </div>
        {searchResults.slice(0, numVisibleNotes).map(([id]) => (
          <NoteCard key={id} id={id} />
        ))}
      </div>
      {searchResults.length > numVisibleNotes ? <div ref={bottomRef} /> : null}
    </div>
  )
}
