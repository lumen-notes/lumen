import { useLocation } from "react-router-dom"
import { FilePreview } from "../components/file-preview"
import { ThemeColor } from "../components/theme-color"

export function FilePage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const path = searchParams.get("path") || ""

  return (
    <div className="grid h-full place-items-center">
      <ThemeColor />
      <FilePreview path={path} />
    </div>
  )
}
