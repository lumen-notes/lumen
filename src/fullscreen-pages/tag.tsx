import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Params } from "react-router-dom"
import { FullscreenContainer } from "../components/fullscreen-container"
import { TagIcon16 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { tagsAtom } from "../global-atoms"

type FullscreenTagPageProps = {
  params: Params<string>
}

export function FullscreenTagPage({ params }: FullscreenTagPageProps) {
  const { "*": name = "" } = params
  const noteCountAtom = React.useMemo(
    () => selectAtom(tagsAtom, (tags) => tags[name]?.length ?? 0),
    [name],
  )
  const noteCount = useAtomValue(noteCountAtom)

  return (
    <FullscreenContainer title={name} icon={<TagIcon16 />} elevation={-1}>
      <LinkHighlightProvider href={`/tags/${name}?fullscreen=true`}>
        <div className="p-4">
          <NoteList key={name} baseQuery={`tag:${name}`} noteCount={noteCount} />
        </div>
      </LinkHighlightProvider>
    </FullscreenContainer>
  )
}
