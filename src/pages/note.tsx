import { useParams } from "react-router-dom"
import { Panels } from "../components/panels"
import { NotePanel } from "../panels/note"

export function NotePage() {
  const params = useParams()
  return (
    <Panels>
      <NotePanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}
