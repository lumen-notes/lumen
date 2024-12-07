import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "../components/app-layout"

export const Route = createFileRoute("/tags/")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout title="Tags">
      <div>Tags</div>
    </AppLayout>
  )
}
