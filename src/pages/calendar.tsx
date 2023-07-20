import { CommandMenu } from "../components/command-menu"
import { Panels } from "../components/panels"
import { CalendarPanel } from "../panels/calendar"

export function CalendarPage() {
  return (
    <Panels>
      <CommandMenu />
      <CalendarPanel />
      <Panels.Outlet />
    </Panels>
  )
}
