import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "../components/app-layout"
import { NoteList } from "../components/note-list"

export const Route = createFileRoute("/")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout title="Notes">
      <div className="p-4 pt-0">
        <NoteList />
      </div>
    </AppLayout>
  )
}
