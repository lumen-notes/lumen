import { useActor } from "@xstate/react"
import React from "react"
import { Link } from "react-router-dom"
import { TagIcon24 } from "../components/icons"
import { GlobalStateContext } from "../global-state"

export function TagsPage() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  // Sort tags by number of notes in descending order
  const sortedTags = React.useMemo(
    () =>
      Object.entries(state.context.tags).sort(
        (a, b) => b[1].length - a[1].length,
      ),
    [state.context.tags],
  )

  return (
    <div className="flex max-w-lg flex-col gap-4 p-4">
      <div className="flex gap-2">
        <TagIcon24 />
        <h2 className="text-lg font-semibold leading-[24px]">Tags</h2>
      </div>
      <ul className="flex flex-col">
        {sortedTags.map(([name, ids]) => (
          <li
            key={name}
            className="flex justify-between border-b border-border-divider py-3 last:border-b-0"
          >
            <Link className="underline underline-offset-2" to={`/tags/${name}`}>
              #{name}
            </Link>
            <span className="text-text-muted">
              {ids.length} {ids.length === 1 ? "note" : "notes"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
