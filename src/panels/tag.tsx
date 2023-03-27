import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { tagsAtom } from "../global-atoms"
import { TagIcon24 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"

export function TagPanel({ id, params = {}, onClose }: PanelProps) {
  const { name = "" } = params
  const noteCountAtom = React.useMemo(
    () => selectAtom(tagsAtom, (tags) => tags[name]?.length ?? 0),
    [name],
  )
  const noteCount = useAtomValue(noteCountAtom)

  return (
    <Panel id={id} title={`#${name}`} icon={<TagIcon24 />} onClose={onClose}>
      <LinkHighlightProvider href={`/tags/${name}`}>
        <div className="p-4">
          <NoteList key={name} baseQuery={`tag:${name}`} noteCount={noteCount} />
        </div>
      </LinkHighlightProvider>
    </Panel>
  )
}
