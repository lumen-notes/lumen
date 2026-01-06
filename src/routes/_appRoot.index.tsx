import { createFileRoute } from "@tanstack/react-router"
import { NoteIcon16 } from "../components/icons"
import { NoteList } from "../components/note-list"
import { PageLayout } from "../components/page-layout"

type RouteSearch = {
  query: string | undefined
  view: "grid" | "list"
}

export const Route = createFileRoute("/_appRoot/")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      query: typeof search.query === "string" ? search.query : undefined,
      view: search.view === "list" ? "list" : "grid",
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { query, view } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <PageLayout title="Notes" icon={<NoteIcon16 />}>
      <div className="p-4 pt-0">
        <NoteList
          query={query ?? ""}
          view={view}
          onQueryChange={(query) =>
            navigate({ search: (prev) => ({ ...prev, query }), replace: true })
          }
          onViewChange={(view) =>
            navigate({ search: (prev) => ({ ...prev, view }), replace: true })
          }
        />
      </div>
    </PageLayout>
  )
}
