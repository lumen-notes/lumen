import { Params } from "react-router-dom"
import { FullscreenContainer } from "../components/fullscreen-container"
import { TagIcon16 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"

type FullscreenTagPageProps = {
  params: Params<string>
}

export function FullscreenTagPage({ params }: FullscreenTagPageProps) {
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
