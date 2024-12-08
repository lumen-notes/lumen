import { createFileRoute } from "@tanstack/react-router"
import { useCallback } from "react"
import { AppLayout } from "../components/app-layout"
import { Button } from "../components/button"
import { IconButton } from "../components/icon-button"
import { MoreIcon16, PinFillIcon12 } from "../components/icons"
import { Markdown } from "../components/markdown"
import { SegmentedControl } from "../components/segmented-control"
import { useNoteById } from "../hooks/note"
import { checkIfPinned } from "../utils/pin"

type RouteSearch = {
  mode: "read" | "write"
}

export const Route = createFileRoute("/notes_/$")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      mode: search.mode === "write" ? "write" : "read",
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { _splat: noteId } = Route.useParams()
  const { mode } = Route.useSearch()
  const navigate = Route.useNavigate()
  const note = useNoteById(noteId)
  const isPinned = checkIfPinned(note)

  const switchToWriting = useCallback(() => {
    navigate({ search: { mode: "write" } })
  }, [navigate])

  const switchToReading = useCallback(() => {
    navigate({ search: { mode: "read" } })
  }, [navigate])

  return (
    <AppLayout
      title={
        <span className="flex items-center gap-2">
          {isPinned ? <PinFillIcon12 className="flex-shrink-0 text-[var(--orange-11)]" /> : null}
          <span>{noteId}.md</span>
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button size="small" shortcut={["⌘", "S"]}>
            Save
          </Button>
          <SegmentedControl aria-label="Mode" size="small">
            <SegmentedControl.Segment
              selected={mode === "read"}
              shortcut={mode !== "read" ? ["⌘", "E"] : undefined}
              onClick={switchToReading}
            >
              Read
            </SegmentedControl.Segment>
            <SegmentedControl.Segment
              selected={mode === "write"}
              shortcut={mode !== "write" ? ["⌘", "E"] : undefined}
              onClick={switchToWriting}
            >
              Write
            </SegmentedControl.Segment>
          </SegmentedControl>
          <IconButton aria-label="More actions" size="small" disableTooltip>
            <MoreIcon16 />
          </IconButton>
        </div>
      }
    >
      <div className="p-4 pb-[50vh]">
        <Markdown>{note?.content ?? ""}</Markdown>
      </div>
    </AppLayout>
  )
}
