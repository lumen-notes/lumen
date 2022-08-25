import React from "react"
import { useInView } from "react-intersection-observer"
import { NoteId } from "../global-state"
import { Card } from "./card"
import { NoteCard } from "./note-card"

type NoteListProps = {
  ids: NoteId[]
}

export function NoteList({ ids }: NoteListProps) {
  // Sort notes by when they were created in descending order
  const sortedIds = React.useMemo(
    () => ids.sort((a, b) => parseInt(b) - parseInt(a)),
    [ids],
  )

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10)

  const [bottomRef, bottomInView] = useInView()

  React.useEffect(() => {
    if (bottomInView) {
      // Render 10 more notes when the user scrolls to the bottom of the list
      setNumVisibleNotes((num) => Math.min(num + 10, sortedIds.length))
    }
  }, [bottomInView, sortedIds.length])

  return (
    <div className="flex flex-col gap-4">
      {sortedIds.slice(0, numVisibleNotes).map((id) => (
        <NoteCard key={id} id={id} />
      ))}
      {numVisibleNotes < sortedIds.length ? (
        <Card ref={bottomRef} className="p-4">
          Loading...
        </Card>
      ) : null}
    </div>
  )
}
