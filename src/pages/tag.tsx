import { useParams } from "react-router-dom"
import { CommandMenu } from "../components/command-menu"
import { Panels } from "../components/panels"
import { TagPanel } from "../panels/tag"

export function TagPage() {
  const params = useParams()

  return (
    <Panels>
      <CommandMenu />
      <TagPanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}
