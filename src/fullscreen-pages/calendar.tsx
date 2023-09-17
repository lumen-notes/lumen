import { useLocation } from "react-router-dom"
import { FullscreenContainer } from "../components/fullscreen-container"
import { CalendarIcon16, CalendarIcon24 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Calendar, DATE_REGEX } from "../panels/calendar"
import { formatDate, formatDateDistance } from "../utils/date"

export function FullscreenCalendarPage() {
  const location = useLocation()
  const date = new URLSearchParams(location.search).get("date") || ""

  // Check if the date is valid
  const isValidDate = DATE_REGEX.test(date) && !isNaN(Date.parse(date))

  if (!isValidDate) {
    return (
      <FullscreenContainer title={date} icon={<CalendarIcon24 />}>
        <div className="p-4 text-text-secondary">Invalid date</div>
      </FullscreenContainer>
    )
  }

  return (
    <FullscreenContainer
      title={formatDate(date)}
      description={formatDateDistance(date)}
      icon={<CalendarIcon16 date={new Date(date).getUTCDate()} />}
    >
      <div className="flex flex-col">
        <Calendar activeDate={date} />
        <div className="p-4">
          <LinkHighlightProvider href={`/calendar?date=${date}`}>
            <NoteList key={date} baseQuery={`date:${date}`} />
          </LinkHighlightProvider>
        </div>
      </div>
    </FullscreenContainer>
  )
}
