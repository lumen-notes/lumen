import { Panels } from "../components/panels"
import { NotesPanel } from "../panels/notes"

export function NotesPage() {
  return (
    <Panels.Container>
      <NotesPanel />
      <Panels.Outlet />
    </Panels.Container>
  )
}
