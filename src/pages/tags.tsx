import { CommandMenu } from "../components/command-menu"
import { Panels } from "../components/panels"
import { TagsPanel } from "../panels/tags"

export function TagsPage() {
  return (
    <Panels>
      <CommandMenu />
      <TagsPanel />
      <Panels.Outlet />
    </Panels>
  )
}
