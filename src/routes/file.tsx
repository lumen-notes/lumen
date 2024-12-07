import { createFileRoute } from "@tanstack/react-router"

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

  if (!path) {
    return <div>File not found</div>
  }

  return <div>{path}</div>
}
