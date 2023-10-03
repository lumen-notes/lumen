import { useLocation } from "react-router-dom"
import { CommandMenu } from "../components/command-menu"
import { FullscreenContainer } from "../components/fullscreen-container"
import { CalendarIcon16, CalendarIcon24 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panels } from "../components/panels"
import { Calendar, CalendarPanel, DATE_REGEX } from "../panels/calendar"
import { formatDate, formatDateDistance } from "../utils/date"
import { useIsFullscreen } from "../utils/use-is-fullscreen"

export function CalendarPage() {
  const isFullscreen = useIsFullscreen()

  if (isFullscreen) {
    return (
      <>
        <CommandMenu />
        <FullscreenCalendarPage />
      </>
    )
  }
  return (
    <Panels>
      <CommandMenu />
      <CalendarPanel />
      <Panels.Outlet />
    </Panels>
  )
}

function FullscreenCalendarPage() {
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
