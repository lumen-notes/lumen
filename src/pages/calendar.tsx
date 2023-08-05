import { CommandMenu } from "../components/command-menu"
import { Panels } from "../components/panels"
import { FullscreenCalendarPage } from "../fullscreen-pages/calendar"
import { CalendarPanel } from "../panels/calendar"
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
