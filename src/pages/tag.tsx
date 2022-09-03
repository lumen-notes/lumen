import { useParams } from "react-router-dom"
import { Panels } from "../components/panels"
import { TagPanel } from "../panels/tag"

export function TagPage() {
  const params = useParams()
  return (
    <Panels>
      <TagPanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}
