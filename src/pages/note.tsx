import { useParams } from "react-router-dom"
import { CommandMenu } from "../components/command-menu"
import { Panels } from "../components/panels"
import { NotePanel } from "../panels/note"
import { useIsFullscreen } from "../utils/use-is-fullscreen"
import { FullscreenNotePage } from "../fullscreen-pages/note"

export function NotePage() {
  const isFullscreen = useIsFullscreen()
  const params = useParams()

  if (isFullscreen) {
    return <FullscreenNotePage params={params} />
  }

  return (
    <Panels>
      <CommandMenu />
      <NotePanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}
