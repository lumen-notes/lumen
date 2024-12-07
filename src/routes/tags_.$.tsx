import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "../components/app-layout"

export const Route = createFileRoute("/tags_/$")({
  component: RouteComponent,
})

function RouteComponent() {
  const { _splat: tag } = Route.useParams()

  return (
    <AppLayout title={`#${tag}`}>
      <div>#{tag}</div>
    </AppLayout>
  )
}
