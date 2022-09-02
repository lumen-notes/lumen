import { useActor } from "@xstate/react"
import { Searcher } from "fast-fuzzy"
import React from "react"
import { Link } from "react-router-dom"
import { TagIcon24 } from "../components/icons"
import { SearchInput } from "../components/search-input"
import { GlobalStateContext } from "../global-state"
import { pluralize } from "../utils/pluralize"
import { useDebounce } from "../utils/use-debounce"

export function TagsPage() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  const [query, setQuery] = React.useState("")
  const debouncedQuery = useDebounce(query)

  // Sort tags alphabetically
  const sortedTags = React.useMemo(
    () => Object.entries(state.context.tags).sort((a, b) => a[0].localeCompare(b[0])),
    [state.context.tags],
  )

  // Create a search index
  const searcher = React.useMemo(() => {
    return new Searcher(sortedTags, {
      keySelector: ([name]) => name,
      threshold: 0.9,
    })
  }, [sortedTags])

  const results = React.useMemo(() => {
    if (!debouncedQuery) {
      return sortedTags
    }

    return searcher.search(debouncedQuery)
  }, [debouncedQuery, sortedTags, searcher])

  return (
    <div className="flex max-w-lg flex-col gap-4 p-4">
      <div className="flex gap-2">
        <TagIcon24 />
        <div className="flex items-baseline gap-1">
          <h2 className="text-lg font-semibold leading-[24px]">Tags</h2>
          <span className="text-text-muted" aria-hidden>
            ·
          </span>
          <span className="text-text-muted">{pluralize(sortedTags.length, "tag")}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <SearchInput
          placeholder={`Search ${pluralize(sortedTags.length, "tag")}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className="flex flex-col">
          {results.map(([name, noteIds]) => (
            <li
              key={name}
              className="flex justify-between border-b border-border-divider py-3 last:border-b-0"
            >
              <Link className="underline underline-offset-2" to={`/tags/${name}`}>
                #{name}
              </Link>
              <span className="text-text-muted">{pluralize(noteIds.length, "note")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
