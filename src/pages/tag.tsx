import { useParams } from "react-router-dom"
import { CommandMenu } from "../components/command-menu"
import { Panels } from "../components/panels"
import { TagPanel } from "../panels/tag"
import { FullscreenTagPage } from "../fullscreen-pages/tag"
import { useIsFullscreen } from "../utils/use-is-fullscreen"

export function TagPage() {
  const isFullscreen = useIsFullscreen()
  const params = useParams()

  if (isFullscreen) {
    return (
      <>
        <CommandMenu />
        <FullscreenTagPage params={params} />
      </>
    )
  }

  return (
    <Panels>
      <CommandMenu />
      <TagPanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}
