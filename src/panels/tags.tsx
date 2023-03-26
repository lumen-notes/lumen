import { useAtomValue } from "jotai"
import React from "react"
import { z } from "zod"
import { sortedTagEntriesAtom, tagSearcherAtom } from "../global-atoms"
import { TagIcon24 } from "../components/icons"
import { Panel } from "../components/panel"
import { PanelProps, Panels } from "../components/panels"
import { SearchInput } from "../components/search-input"
import { pluralize } from "../utils/pluralize"
import { useSearchParam } from "../utils/use-search-param"

export function TagsPanel({ id, onClose }: PanelProps) {
  const sortedTagEntries = useAtomValue(sortedTagEntriesAtom)
  const tagSearcher = useAtomValue(tagSearcherAtom)

  const [query, setQuery] = useSearchParam("q", {
    defaultValue: "",
    schema: z.string(),
    replace: true,
  })

  const deferredQuery = React.useDeferredValue(query)

  const searchResults = React.useMemo(() => {
    return deferredQuery ? tagSearcher.search(deferredQuery) : sortedTagEntries
  }, [tagSearcher, deferredQuery, sortedTagEntries])

  return (
    <Panel id={id} title="Tags" icon={<TagIcon24 />} onClose={onClose}>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-col gap-2">
          <SearchInput
            placeholder={`Search ${pluralize(sortedTagEntries.length, "tag")}…`}
            value={query}
            onChange={setQuery}
          />
          {deferredQuery ? (
            <span className="coarse:sm text-sm text-text-secondary">
              {pluralize(searchResults.length, "result")}
            </span>
          ) : null}
        </div>
        <ul className="flex flex-col">
          {searchResults.map(([name, noteIds]) => (
            <li
              key={name}
              className="flex items-center justify-between border-b border-border-secondary py-3 last:border-b-0"
            >
              <Panels.Link className="link" to={`/tags/${name}`} target="_blank">
                #{name}
              </Panels.Link>
              <span className="text-text-secondary">{pluralize(noteIds.length, "note")}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
