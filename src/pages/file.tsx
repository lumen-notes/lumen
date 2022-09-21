import { useLocation } from "react-router-dom"
import { FilePreview } from "../components/file-preview"

export function FilePage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const path = searchParams.get("path") || ""

  return (
    <div className="grid h-screen place-items-center">
      <FilePreview path={path} />
    </div>
  )
}
