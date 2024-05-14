import { useParams } from "react-router-dom"
import { NotePanel } from "../panels/note"
import { Panels } from "../components/panels"

export function NotePage() {
  const params = useParams()

  return (
    <Panels.Container>
      <NotePanel params={params} />
      <Panels.Outlet />
    </Panels.Container>
  )
}
