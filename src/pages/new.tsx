import { useNavigate, useSearchParams } from "react-router-dom"
import { CommandMenu } from "../components/command-menu"
import { FullscreenContainer } from "../components/fullscreen-container"
import { FullscreenNoteForm } from "../components/fullscreen-note-form"
import { NoteIcon16 } from "../components/icons"

export function NewPage() {
  const [searchParams] = useSearchParams()
  const body = searchParams.get("body") ?? ""
  const navigate = useNavigate()

  return (
    <div className="h-screen pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] [@supports(height:100svh)]:h-[100svh]">
      <FullscreenContainer title="New note" icon={<NoteIcon16 />} elevation={1}>
        <CommandMenu />
        <FullscreenNoteForm
          defaultValue={body}
          onSubmit={(note) => {
            navigate(`/${note.id}?fullscreen=true`, { replace: true })
          }}
        />
      </FullscreenContainer>
    </div>
  )
}
