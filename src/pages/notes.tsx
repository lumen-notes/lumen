import { CommandMenu } from "../components/command-menu"
import { Panels } from "../components/panels"
import { NotesPanel } from "../panels/notes"

export function NotesPage() {
  return (
    <Panels>
      <CommandMenu />
      <NotesPanel />
      <Panels.Outlet />
    </Panels>
  )
}
