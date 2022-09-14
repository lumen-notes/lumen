import { useActor } from "@xstate/react"
import { Searcher } from "fast-fuzzy"
import React from "react"
import { z } from "zod"
import { TagIcon24 } from "../components/icons"
import { Panel } from "../components/panel"
import { PanelProps, Panels } from "../components/panels"
import { SearchInput } from "../components/search-input"
import { GlobalStateContext } from "../global-state"
import { pluralize } from "../utils/pluralize"
import { useDebounce } from "../utils/use-debounce"
import { useSearchParam } from "../utils/use-search-param"

export function TagsPanel({ id, onClose }: PanelProps) {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  const [query, setQuery] = useSearchParam("q", {
    defaultValue: "",
    schema: z.string(),
    replace: true,
  })

  const debouncedQuery = useDebounce(query)

  // Sort tags alphabetically
  const sortedTags = React.useMemo(
    () =>
      Object.entries(state.context.tags)
        .map(([name, noteIds]): [string, number] => [name, noteIds.length])
        .sort((a, b) => a[0].localeCompare(b[0])),
    [state.context.tags],
  )

  // Create a search index
  const searcher = React.useMemo(() => {
    const entries = Object.entries(state.context.tags)
      .map(([name, noteIds]): [string, number] => [name, noteIds.length])
      // Sort by note count in descending order then alphabetically
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    return new Searcher(entries, {
      keySelector: ([name]) => name,
      threshold: 0.8,
    })
  }, [state.context.tags])

  const results = React.useMemo(() => {
    if (!debouncedQuery) {
      return sortedTags
    }

    return searcher.search(debouncedQuery)
  }, [debouncedQuery, sortedTags, searcher])

  return (
    <Panel
      id={id}
      title="Tags"
      description={pluralize(sortedTags.length, "tag")}
      icon={<TagIcon24 />}
      onClose={onClose}
    >
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <SearchInput
            placeholder={`Search ${pluralize(sortedTags.length, "tag")}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {debouncedQuery ? (
            <span className="text-xs text-text-muted">{pluralize(results.length, "result")}</span>
          ) : null}
        </div>
        <ul className="flex flex-col">
          {results.map(([name, noteCount]) => (
            <li
              key={name}
              className="flex justify-between border-b border-border-divider py-3 last:border-b-0"
            >
              <Panels.Link className="underline underline-offset-2" to={`/tags/${name}`}>
                #{name}
              </Panels.Link>
              <span className="text-text-muted">{pluralize(noteCount, "note")}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
