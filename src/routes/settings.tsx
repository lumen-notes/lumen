import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "../components/app-layout"

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout title="Settings">
      <div>Settings</div>
    </AppLayout>
  )
}
