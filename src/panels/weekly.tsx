import React from "react"
import { CalendarIcon16, TriangleRightIcon8 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteCard } from "../components/note-card"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { useNoteById } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { formatWeek, formatWeekDistance } from "../utils/date"
import { selectAtom } from "jotai/utils"
import { globalStateMachineAtom } from "../global-state"
import { useAtomValue } from "jotai"

const isResolvingRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.resolvingRepo"),
)

export function WeeklyPanel({ id, params = {}, onClose }: PanelProps) {
  const { week = "" } = params
  const note = useNoteById(week)
  const isResolvingRepo = useAtomValue(isResolvingRepoAtom)
  const searchNotes = useSearchNotes()
  const backlinks = React.useMemo(
    () => searchNotes(`link:"${week}" -id:"${week}"`),
    [week, searchNotes],
  )

  return (
    <Panel
      id={id}
      title={formatWeek(week)}
      description={formatWeekDistance(week)}
      icon={<CalendarIcon16 date={Number(week.split("-W")[1])} />}
      onClose={onClose}
    >
      <div className="flex flex-col">
        <div className="flex flex-col gap-4 p-4">
          {!isResolvingRepo && !note ? (
            <NoteCardForm key={week} minHeight="10rem" id={week} />
          ) : (
            <NoteCard id={week} />
          )}
          {backlinks.length > 0 ? (
            <details open className="group space-y-4">
              <summary className="-m-4 inline-flex cursor-pointer list-none items-center gap-2 rounded-sm p-4 text-text-secondary hover:text-text [&::-webkit-details-marker]:hidden">
                <TriangleRightIcon8 className=" group-open:rotate-90" />
                Backlinks
              </summary>
              <LinkHighlightProvider href={`/${week}`}>
                <NoteList baseQuery={`link:"${week}" -id:"${week}"`} />
              </LinkHighlightProvider>
            </details>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}
