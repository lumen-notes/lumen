import { useAtomValue } from "jotai"
import React from "react"
import { z } from "zod"
import { TagIcon24 } from "../components/icons"
import { useLink } from "../components/link-context"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { SearchInput } from "../components/search-input"
import { sortedTagEntriesAtom, tagSearcherAtom } from "../global-atoms"
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

  const tagTree = React.useMemo(() => buildTagTree(searchResults), [searchResults])

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
        <TagTree tree={tagTree} />
      </div>
    </Panel>
  )
}

type TagTreeNode = {
  name: string
  count: number
  children: TagTreeNode[]
}

/** Build a tree from a flat list of tags */
function buildTagTree(tags: [string, string[]][]): TagTreeNode[] {
  const tree: TagTreeNode[] = []

  for (const [name, noteIds] of tags) {
    const parts = name.split("/")

    let parent = tree

    for (const part of parts) {
      const existing = parent.find((node) => node.name === part)

      if (existing) {
        parent = existing.children
      } else {
        const node = { name: part, count: noteIds.length, children: [] }
        parent.push(node)
        parent = node.children
      }
    }
  }

  return tree
}

type TagTreeProps = {
  tree: TagTreeNode[]
  path?: string[]
  depth?: number
}

function TagTree({ tree, path = [], depth = 0 }: TagTreeProps) {
  const Link = useLink()

  if (tree.length === 0) {
    return null
  }

  return (
    <ul>
      {tree.map((node) => {
        return (
          <li key={node.name}>
            <span
              className="inline-flex gap-2 py-2"
              style={{ paddingLeft: `calc(${depth} * 1.5rem)` }}
            >
              <Link className="link" to={`/tags/${[...path, node.name].join("/")}`} target="_blank">
                {node.name}
              </Link>
              <span className="text-text-secondary">{node.count}</span>
            </span>
            <TagTree tree={node.children} path={[...path, node.name]} depth={depth + 1} />
          </li>
        )
      })}
    </ul>
  )
}
