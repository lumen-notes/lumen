import { useParams } from "react-router-dom"
import { TagPanel } from "../panels/tag"
import { Panels } from "../components/panels"

export function TagPage() {
  const params = useParams()

  return (
    <Panels.Container>
      <TagPanel params={params} />
      <Panels.Outlet />
    </Panels.Container>
  )
}
