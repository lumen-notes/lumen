import { Panels } from "../components/panels"
import { TagsPanel } from "../panels/tags"

export function TagsPage() {
  return (
    <Panels.Container>
      <TagsPanel />
      <Panels.Outlet />
    </Panels.Container>
  )
}
