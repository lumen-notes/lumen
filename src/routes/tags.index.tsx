import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/tags/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Tags</div>
}
