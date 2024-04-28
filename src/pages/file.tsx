import { useLocation } from "react-router-dom"
import { FilePanel } from "../panels/file"
import { Panels } from "../components/panels"

export function FilePage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const path = searchParams.get("path") || ""

  return (
    <Panels.Container>
      <FilePanel params={{ path }} />
      <Panels.Outlet />
    </Panels.Container>
  )
}
