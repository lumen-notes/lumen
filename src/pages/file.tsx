import { useLocation } from "react-router-dom"
import { FilePanel } from "../panels/file"

export function FilePage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const path = searchParams.get("path") || ""

  return <FilePanel params={{ path }} />
}
