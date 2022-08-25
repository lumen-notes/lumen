import { useActor } from "@xstate/react"
import React from "react"
import { useParams } from "react-router-dom"
import { Card } from "../components/card"
import { CalendarIcon24 } from "../components/icons"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { GlobalStateContext } from "../global-state"
import { formatDate, formatDateDistance } from "../utils/date"

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function DatePage() {
  const { date = "" } = useParams()
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  // Check if the date is valid
  const isValidDate = DATE_REGEX.test(date) && !isNaN(Date.parse(date))

  if (!isValidDate) {
    return <div>Invalid date</div>
  }

  const noteIds = state.context.dates[date] || []

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

      <NoteList ids={noteIds} />
    </div>
  )
}
