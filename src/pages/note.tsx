import { useParams } from "react-router-dom"
import { CommandMenu } from "../components/command-menu"
import { Panels } from "../components/panels"
import { NotePanel } from "../panels/note"

export function NotePage() {
  const params = useParams()
  return (
    <Panels>
      <CommandMenu />
      <NotePanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}
