import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "../components/app-layout"
import { NoteList } from "../components/note-list"

type RouteSearch = {
  query: string | undefined
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      query: typeof search.query === "string" ? search.query : undefined,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { query } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <AppLayout title="Notes">
      <div className="p-4 pt-0">
        <NoteList
          query={query ?? ""}
          onQueryChange={(query) =>
            navigate({ to: ".", search: (prev) => ({ ...prev, query }), replace: true })
          }
        />
      </div>
    </AppLayout>
  )
}
