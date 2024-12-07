import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/notes/")({
  loader: () => redirect({ to: "/" }),
})
