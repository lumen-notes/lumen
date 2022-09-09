import { useActor } from "@xstate/react"
import React from "react"
import { CalendarIcon24 } from "../components/icons"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { formatDate, formatDateDistance } from "../utils/date"

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function DatePanel({ id, params, onClose }: PanelProps) {
  const { date = "" } = params
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  // Check if the date is valid
  const isValidDate = DATE_REGEX.test(date) && !isNaN(Date.parse(date))

  if (!isValidDate) {
    return <div>Invalid date</div>
  }

  const noteIds = state.context.dates[date] || []

  return (
    <Panel
      id={id}
      title={formatDate(date)}
      description={formatDateDistance(date)}
      icon={<CalendarIcon24 date={new Date(date).getUTCDate()} />}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 px-4 pb-4">
        <NoteForm defaultBody={`[[${date}]]`} />
        <NoteList key={date} ids={noteIds} />
      </div>
    </Panel>
  )
}
