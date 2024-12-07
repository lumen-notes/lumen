import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/tags_/$")({
  component: RouteComponent,
})

function RouteComponent() {
  const { _splat: tag } = Route.useParams()
  return <div>#{tag}</div>
}
