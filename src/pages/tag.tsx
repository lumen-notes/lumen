import { Params, useParams } from "react-router-dom"
import { CommandMenu } from "../components/command-menu"
import { FullscreenContainer } from "../components/fullscreen-container"
import { TagIcon16 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panels } from "../components/panels"
import { TagPanel } from "../panels/tag"
// import { useIsFullscreen } from "../utils/use-is-fullscreen"

export function TagPage() {
  // const isFullscreen = useIsFullscreen()
  const params = useParams()

  // if (isFullscreen) {
  //   return (
  //     <>
  //       <CommandMenu />
  //       <FullscreenTagPage params={params} />
  //     </>
  //   )
  // }

  return (
    <Panels>
      <CommandMenu />
      <TagPanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}

type FullscreenTagPageProps = {
  params: Params<string>
}

function FullscreenTagPage({ params }: FullscreenTagPageProps) {
  const { "*": name = "" } = params

  return (
    <FullscreenContainer title={name} icon={<TagIcon16 />}>
      <LinkHighlightProvider href={`/tags/${name}?fullscreen=true`}>
        <div className="p-4">
          <NoteList key={name} baseQuery={`tag:${name}`} />
        </div>
      </LinkHighlightProvider>
    </FullscreenContainer>
  )
}
