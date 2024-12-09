import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "../components/app-layout"
import { FilePreview } from "../components/file-preview"

type RouteSearch = {
  path: string
}

export const Route = createFileRoute("/file")({
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
    <AppLayout title={path.split("/").pop() || "No file selected"}>
      <div className="grid h-full w-full place-items-center">
        {path ? <FilePreview path={path} /> : null}
      </div>
    </AppLayout>
  )
}
