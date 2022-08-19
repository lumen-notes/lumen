import { useActor } from "@xstate/react"
import React from "react"
import { useInView } from "react-intersection-observer"
import { useParams } from "react-router-dom"
import { Card } from "../components/card"
import { TagIcon24 } from "../components/icons"
import { NoteCard } from "../components/note-card"
import { NoteForm } from "../components/note-form"
import { GlobalStateContext } from "../global-state"

export function TagPage() {
  const { name = "" } = useParams()

  const globalState = React.useContext(GlobalStateContext)

  // TODO: Use selectors to avoid unnecessary rerenders
  const [state] = useActor(globalState.service)

  // Sort notes by when they were created in descending order
  const noteIds = state.context.tags[name] || []
  const sortedNoteIds = noteIds.sort((a, b) => parseInt(b) - parseInt(a))

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10)

  const { ref: bottomRef, inView: bottomInView } = useInView()

  React.useEffect(() => {
    if (bottomInView) {
      // Render 10 more notes when the user scrolls to the bottom of the list
      setNumVisibleNotes((num) => Math.min(num + 10, sortedNoteIds.length))
    }
  }, [bottomInView, sortedNoteIds.length])

  return (
    <div className="flex max-w-lg flex-col gap-4 p-4">
      <div className="flex gap-2">
        <TagIcon24 />
        <div className="flex items-baseline gap-1">
          <h2 className="text-lg font-semibold leading-[24px]">#{name}</h2>
          <span className="text-text-muted" aria-hidden>
            ·
          </span>
          <span className="text-text-muted">
            {sortedNoteIds.length}{" "}
            {sortedNoteIds.length === 1 ? "note" : "notes"}
          </span>
        </div>
      </div>

      <Card className="p-2">
        <NoteForm defaultBody={`#${name}`} />
      </Card>

      {sortedNoteIds.slice(0, numVisibleNotes).map((id) => (
        <NoteCard key={id} id={id} />
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
