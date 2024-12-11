import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/notes/")({
  loader: () => {
    throw redirect({ to: "/", search: { query: undefined, view: "grid" } })
  },
})
