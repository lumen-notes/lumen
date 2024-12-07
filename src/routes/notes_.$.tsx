import { createFileRoute } from "@tanstack/react-router"
import { AppLayout } from "../components/app-layout"
import { IconButton } from "../components/icon-button"
import { EditIcon16, PinFillIcon12 } from "../components/icons"
import { Markdown } from "../components/markdown"
import { useNoteById } from "../hooks/note"
import { checkIfPinned } from "../utils/pin"

export const Route = createFileRoute("/notes_/$")({
  component: RouteComponent,
})

function RouteComponent() {
  const { _splat: noteId } = Route.useParams()
  const note = useNoteById(noteId)
  const isPinned = checkIfPinned(note)

  return (
    <AppLayout
      title={
        <span className="flex items-center gap-2">
          {isPinned ? <PinFillIcon12 className="flex-shrink-0 text-[var(--orange-11)]" /> : null}
          <span>{noteId}.md</span>
        </span>
      }
      actions={
        <IconButton aria-label="Write" size="small" shortcut={["⌘", "E"]}>
          <EditIcon16 />
        </IconButton>
      }
    >
      <div className="p-4">
        <Markdown>{note?.content ?? ""}</Markdown>
      </div>
    </AppLayout>
  )
}
