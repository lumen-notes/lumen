import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_appRoot/notes/")({
  loader: () => {
    throw redirect({ to: "/", search: { query: undefined, view: "grid" } })
  },
})
