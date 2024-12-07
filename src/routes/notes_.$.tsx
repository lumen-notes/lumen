import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/notes_/$")({
  component: RouteComponent,
})

function RouteComponent() {
  const { _splat: noteId } = Route.useParams()
  return <div>{noteId}.md</div>
}
