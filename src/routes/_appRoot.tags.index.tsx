import { createFileRoute, Link } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { useDeferredValue, useMemo, useState } from "react"
import { AppLayout } from "../components/app-layout"
import { GridIcon16, ListIcon16, SortIcon16, TagIcon16 } from "../components/icons"
import { PillButton } from "../components/pill-button"
import { SearchInput } from "../components/search-input"
import { sortedTagEntriesAtom, tagSearcherAtom } from "../global-state"
import { pluralize } from "../utils/pluralize"
import { DropdownMenu } from "../components/dropdown-menu"
import { cx } from "../utils/cx"
import { IconButton } from "../components/icon-button"

type RouteSearch = {
  query: string | undefined
}

export const Route = createFileRoute("/_appRoot/tags/")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      query: typeof search.query === "string" ? search.query : undefined,
    }
  },
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Tags · Lumen" }],
  }),
})

function RouteComponent() {
  const { query } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [sortBy, setSortBy] = useState<"name" | "count">("name")
  const [viewAs, setViewAs] = useState<"grid" | "list">("grid")

  const sortedTagEntries = useAtomValue(sortedTagEntriesAtom)
  const tagSearcher = useAtomValue(tagSearcherAtom)

  const deferredQuery = useDeferredValue(query)

  const searchResults = useMemo(() => {
    return deferredQuery ? tagSearcher.search(deferredQuery) : sortedTagEntries
  }, [tagSearcher, deferredQuery, sortedTagEntries])

  const tagTree = useMemo(() => buildTagTree(searchResults), [searchResults])

  return (
    <AppLayout title="Tags" icon={<TagIcon16 />}>
      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <SearchInput
              placeholder={`Search ${pluralize(sortedTagEntries.length, "tag")}…`}
              value={query ?? ""}
              onChange={(value) => navigate({ search: { query: value }, replace: true })}
            />
            {/* view mode and sorting */}
            <IconButton
              aria-label={viewAs === "grid" ? "List view" : "Grid view"}
              className="h-10 w-10 rounded-lg bg-bg-secondary hover:bg-bg-tertiary eink:ring-1 eink:ring-inset eink:ring-border eink:focus-visible:ring-2 coarse:h-12 coarse:w-12"
              onClick={() => setViewAs(viewAs === "grid" ? "list" : "grid")}
            >
              {viewAs === "grid" ? <ListIcon16 /> : <GridIcon16 />}
            </IconButton>
            <DropdownMenu modal={false}>
              <DropdownMenu.Trigger asChild>
                <IconButton
                  aria-label="Sort"
                  className="h-10 w-10 rounded-lg bg-bg-secondary hover:bg-bg-tertiary eink:ring-1 eink:ring-inset eink:ring-border eink:focus-visible:ring-2 coarse:h-12 coarse:w-12"
                >
                  <SortIcon16 />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onSelect={() => setSortBy("name")}>
                  <span>Name</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => setSortBy("count")}>
                  <span>Count</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
          <div className="flex flex-row gap-2"></div>
          {deferredQuery ? (
            <span className="text-sm text-text-secondary">
              {pluralize(searchResults.length, "result")}
            </span>
          ) : null}
        </div>

        <TagTree tree={tagTree} sortBy={sortBy} viewAs={viewAs} />
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
  sortBy?: "name" | "count"
  viewAs?: "grid" | "list"
}

// TODO: Improve accessibility of the tree
function TagTree({ tree, path = [], depth = 0, sortBy, viewAs }: TagTreeProps) {
  if (tree.length === 0) {
    return null
  }

  const sortedTree = [...tree].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    } else if (sortBy === "count") {
      return b.count - a.count
    }

    return 0
  })

  return (
    <ul className={cx("flex flex-col gap-3", viewAs === "grid" ? "flex-row flex-wrap" : "")}>
      {sortedTree.map((node) => {
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
  // const [isExpanded, setIsExpanded] = useState(true)

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
        {/* {node.children.length > 0 ? (
          <IconButton
            aria-label={isExpanded ? "Collapse" : "Expand"}
            className="h-6 w-6 rounded-full"
            onClick={() => setIsExpanded(!isExpanded)}
            disableTooltip
          >
            <TriangleRightIcon12
              className={cx("transition-transform", isExpanded ? "rotate-90" : "rotate-0")}
            />
          </IconButton>
        ) : null} */}
      </div>
      <div
        //  hidden={!isExpanded}
        className="empty:hidden"
      >
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
