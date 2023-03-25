import { TagIcon24 } from "../components/icons"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"

export function TagPanel({ id, params = {}, onClose }: PanelProps) {
  const { name = "" } = params

  return (
    <Panel id={id} title={`#${name}`} icon={<TagIcon24 />} onClose={onClose}>
      <LinkHighlightProvider href={`/tags/${name}`}>
        <div className="p-4">
          <NoteList key={name} baseQuery={`tag:${name}`} />
        </div>
      </LinkHighlightProvider>
    </Panel>
  )
}
