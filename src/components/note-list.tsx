import { useActor } from "@xstate/react"
import { Searcher } from "fast-fuzzy"
import debounce from "lodash.debounce"
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

  const [results, setResults] = React.useState<NoteId[]>(sortedIds)

  const search = debounce((value: string) => {
    if (value) {
      setResults(searcher.search(value).map(([id]) => id))
    } else {
      // If the search value is empty, show all notes in sorted order
      setResults(sortedIds)
    }
  }, 300)

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
          onChange={(event) => search(event.target.value)}
        />
      </Card>
      {results.slice(0, numVisibleNotes).map((id) => (
        <NoteCard key={id} id={id} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
