import { useAtomValue } from "jotai"
import React from "react"
import { z } from "zod"
import { IconButton } from "../components/icon-button"
import { DotIcon8, TagIcon24, TriangleRightIcon8 } from "../components/icons"
import { useLink } from "../components/link-context"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { SearchInput } from "../components/search-input"
import { sortedTagEntriesAtom, tagSearcherAtom } from "../global-atoms"
import { cx } from "../utils/cx"
import { pluralize } from "../utils/pluralize"
import { useSearchParam } from "../utils/use-search-param"

export function TagsPanel({ id, onClose }: PanelProps) {
  const Link = useLink()
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
        {deferredQuery ? (
          <ul>
            {searchResults.map(([name]) => (
              <li key={name}>
                <div className="inline-grid grid-cols-[1.5rem,1fr] items-center gap-2 coarse:grid-cols-[2rem,1fr]">
                  <div className="grid place-items-center text-text-secondary">
                    <DotIcon8 />
                  </div>
                  <span className="py-2 leading-4 coarse:py-3">
                    <Link className="link" to={`/tags/${name}`} target="_blank">
                      {name}
                    </Link>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <TagTree tree={tagTree} />
        )}
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

// TODO: Improve accessibility of the tree
function TagTree({ tree, path = [], depth = 0 }: TagTreeProps) {
  if (tree.length === 0) {
    return null
  }

  return (
    <ul>
      {tree.map((node) => {
        return <TagTreeItem key={node.name} node={node} path={path} depth={depth} />
      })}
    </ul>
  )
}

type TagTreeItemProps = {
  node: TagTreeNode
  path?: string[]
  depth?: number
}

function TagTreeItem({ node, path = [], depth = 0 }: TagTreeItemProps) {
  const Link = useLink()
  // TODO: Persist expanded state
  const [isExpanded, setIsExpanded] = React.useState(true)

  return (
    <li>
      <div
        className="inline-grid grid-cols-[1.5rem,1fr] items-center gap-2 coarse:grid-cols-[2rem,1fr]"
        style={{ paddingLeft: `calc(${depth} * 1.5rem)` }}
      >
        {node.children.length > 0 ? (
          <IconButton
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={() => setIsExpanded(!isExpanded)}
            disableTooltip
          >
            <TriangleRightIcon8
              className={cx("transition-transform", isExpanded ? "rotate-90" : "rotate-0")}
            />
          </IconButton>
        ) : (
          <div className="grid place-items-center text-text-secondary">
            <DotIcon8 />
          </div>
        )}
        <span className="py-2 leading-4 coarse:py-3">
          <Link className="link" to={`/tags/${[...path, node.name].join("/")}`} target="_blank">
            {node.name}
          </Link>
        </span>
      </div>
      <div hidden={!isExpanded}>
        <TagTree
          key={node.name}
          tree={node.children}
          path={[...path, node.name]}
          depth={depth + 1}
        />
      </div>
    </li>
  )
}
