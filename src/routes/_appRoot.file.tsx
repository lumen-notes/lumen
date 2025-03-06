import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "../components/app-layout"
import { FilePreview } from "../components/file-preview"
import { FileIcon16 } from "../components/icons"

type RouteSearch = {
  path: string
}

export const Route = createFileRoute("/_appRoot/file")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      path: String(search.path ?? ""),
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { path } = Route.useSearch()

  return (
    <AppLayout title={path.split("/").pop() || "No file selected"} icon={<FileIcon16 />}>
      <div className="grid h-full w-full place-items-center">
        {path ? <FilePreview path={path} /> : null}
      </div>
    </AppLayout>
  )
}
