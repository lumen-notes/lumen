import { useActor } from "@xstate/react"
import React from "react"
import { useInView } from "react-intersection-observer"
import { useParams } from "react-router-dom"
import { Card } from "../components/card"
import { CalendarIcon24, TagIcon24 } from "../components/icons"
import { NoteCard } from "../components/note-card"
import { NoteForm } from "../components/note-form"
import { GlobalStateContext } from "../global-state"
import { formatDate, formatDateDistance } from "../utils/date"
import { pluralize } from "../utils/pluralize"

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function DatePage() {
  const { date = "" } = useParams()

  const globalState = React.useContext(GlobalStateContext)
  // TODO: Use selectors to avoid unnecessary rerenders
  const [state] = useActor(globalState.service)
  const noteIds = state.context.dates[date] || []
  // Sort notes by when they were created in ascending order
  const sortedNoteIds = noteIds.sort((a, b) => parseInt(a) - parseInt(b))

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10)

  const { ref: bottomRef, inView: bottomInView } = useInView()

  React.useEffect(() => {
    if (bottomInView) {
      // Render 10 more notes when the user scrolls to the bottom of the list
      setNumVisibleNotes((num) => Math.min(num + 10, sortedNoteIds.length))
    }
  }, [bottomInView, sortedNoteIds.length])

  // Check if the date is valid
  const isValidDate = DATE_REGEX.test(date) && !isNaN(Date.parse(date))

  if (!isValidDate) {
    return <div>Invalid date</div>
  }

  return (
    <div className="flex max-w-lg flex-col gap-4 p-4">
      <div className="flex gap-2">
        <CalendarIcon24 date={new Date(date).getUTCDate()} />
        <div className="flex items-baseline gap-1">
          <h2 className="text-lg font-semibold leading-[24px]">
            {formatDate(date)}
          </h2>
          <span className="text-text-muted" aria-hidden>
            ·
          </span>
          <span className="text-text-muted">{formatDateDistance(date)}</span>
        </div>
      </div>

      <Card className="p-2">
        <NoteForm defaultBody={`[[${date}]]`} />
      </Card>

      {sortedNoteIds.slice(0, numVisibleNotes).map((id) => (
        <NoteCard key={id} id={id} />
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
