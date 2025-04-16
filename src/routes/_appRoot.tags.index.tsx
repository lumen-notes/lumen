import { createFileRoute, Link } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { useDeferredValue, useMemo } from "react"
import { AppLayout } from "../components/app-layout"
import { IconButton } from "../components/icon-button"
import {
  GridIcon16,
  ListIcon16,
  SortAlphabetAscIcon16,
  SortNumberDescIcon16,
  TagIcon16,
} from "../components/icons"
import { PillButton } from "../components/pill-button"
import { SearchInput } from "../components/search-input"
import { sortedTagEntriesAtom, tagSearcherAtom } from "../global-state"
import { pluralize } from "../utils/pluralize"

type RouteSearch = {
  query: string | undefined
  sort: "name" | "count"
  view: "grid" | "list"
}

export const Route = createFileRoute("/_appRoot/tags/")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      query: typeof search.query === "string" ? search.query : undefined,
      sort: search.sort === "name" || search.sort === "count" ? search.sort : "name",
      view: search.view === "grid" || search.view === "list" ? search.view : "grid",
    }
  },
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Tags · Lumen" }],
  }),
})

function RouteComponent() {
  const { query, sort, view } = Route.useSearch()
  const navigate = Route.useNavigate()

  const sortedTagEntries = useAtomValue(sortedTagEntriesAtom)
  const tagSearcher = useAtomValue(tagSearcherAtom)

  const deferredQuery = useDeferredValue(query)

  const searchResults = useMemo(() => {
    const results = deferredQuery ? tagSearcher.search(deferredQuery) : sortedTagEntries

    return results.sort((a, b) => {
      // Sort by count descending
      if (sort === "count") {
        return b[1].length - a[1].length
      }
      // Sort by name ascending
      return a[0].localeCompare(b[0])
    })
  }, [tagSearcher, deferredQuery, sortedTagEntries, sort])

  const tagTree = useMemo(() => buildTagTree(searchResults, sort), [searchResults, sort])

  return (
    <AppLayout title="Tags" icon={<TagIcon16 />}>
      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <SearchInput
              placeholder={`Search ${pluralize(sortedTagEntries.length, "tag")}…`}
              value={query ?? ""}
              onChange={(value) =>
                navigate({ search: { query: value, sort, view }, replace: true })
              }
            />
            <IconButton
              aria-label={view === "grid" ? "List view" : "Grid view"}
              className="h-10 w-10 rounded-lg bg-bg-secondary hover:bg-bg-tertiary eink:ring-1 eink:ring-inset eink:ring-border eink:focus-visible:ring-2 coarse:h-12 coarse:w-12"
              onClick={() =>
                navigate({ search: { query, sort, view: view === "grid" ? "list" : "grid" } })
              }
            >
              {view === "grid" ? <ListIcon16 /> : <GridIcon16 />}
            </IconButton>
            <IconButton
              aria-label={sort === "count" ? "Sort by name" : "Sort by count"}
              className="h-10 w-10 rounded-lg bg-bg-secondary hover:bg-bg-tertiary eink:ring-1 eink:ring-inset eink:ring-border eink:focus-visible:ring-2 coarse:h-12 coarse:w-12"
              onClick={() =>
                navigate({ search: { query, sort: sort === "count" ? "name" : "count", view } })
              }
            >
              {sort === "count" ? <SortAlphabetAscIcon16 /> : <SortNumberDescIcon16 />}
            </IconButton>
          </div>
          {deferredQuery ? (
            <span className="text-sm text-text-secondary">
              {pluralize(searchResults.length, "result")}
            </span>
          ) : null}
        </div>
        {view === "grid" ? (
          <ul className="flex flex-wrap gap-3">
            {searchResults.map(([tag, noteIds]) => (
              <li key={tag}>
                <PillButton asChild>
                  <Link
                    to="/tags/$"
                    params={{ _splat: tag }}
                    search={{ query: undefined, view: "grid" }}
                  >
                    {tag}
                    <span className="text-text-secondary">{noteIds.length}</span>
                  </Link>
                </PillButton>
              </li>
            ))}
          </ul>
        ) : (
          <TagTree tree={tagTree} />
        )}
      </div>
    </AppLayout>
  )
}

type TagTreeNode = {
  name: string
  count: number
  children: TagTreeNode[]
}

/** Build a tree from a flat list of tags */
function buildTagTree(tags: [string, string[]][], sort: "name" | "count"): TagTreeNode[] {
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

  // Sort the tree nodes based on the sort parameter
  const sortNodes = (nodes: TagTreeNode[]): TagTreeNode[] => {
    return nodes
      .sort((a, b) => {
        // Sort by count descending
        if (sort === "count") {
          return b.count - a.count
        }
        // Sort by name ascending
        return a.name.localeCompare(b.name)
      })
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }))
  }

  return sortNodes(tree)
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
    <ul className="flex flex-col gap-3">
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
  return (
    <li className="flex flex-col gap-3">
      <div className="flex items-center gap-1" style={{ paddingLeft: `calc(${depth} * 1.5rem)` }}>
        <PillButton asChild>
          <Link
            to="/tags/$"
            params={{ _splat: [...path, node.name].join("/") }}
            search={{
              query: undefined,
              view: "grid",
            }}
          >
            {node.name}
            <span className="text-text-secondary">{node.count}</span>
          </Link>
        </PillButton>
      </div>
      <div className="empty:hidden">
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
