import { createFileRoute, Link } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import React, { useDeferredValue, useMemo, useState } from "react"
import { AppLayout } from "../components/app-layout"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import {
  ChevronRightIcon12,
  GridIcon16,
  ListIcon16,
  SortAlphabetAscIcon16,
  SortNumberDescIcon16,
  TagIcon16,
} from "../components/icons"
import { PillButton } from "../components/pill-button"
import { SearchInput } from "../components/search-input"
import { sortedTagEntriesAtom, tagSearcherAtom } from "../global-state"
import { cx } from "../utils/cx"
import { pluralize } from "../utils/pluralize"

type View = "grid" | "list"

const viewIcons: Record<View, React.ReactNode> = {
  grid: <GridIcon16 />,
  list: <ListIcon16 />,
}

type RouteSearch = {
  query: string | undefined
  sort: "name" | "count"
  view: View
}

export const Route = createFileRoute("/_appRoot/tags/")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      query: typeof search.query === "string" ? search.query : undefined,
      sort: search.sort === "name" || search.sort === "count" ? search.sort : "name",
      view: search.view === "grid" || search.view === "list" ? search.view : "list",
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
      <div className="flex flex-col gap-4 px-4 pt-0 pb-[50vh]">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[auto_auto_1fr] gap-2">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton
                  aria-label="View"
                  className="h-10 w-10 rounded-lg bg-bg-secondary hover:!bg-bg-secondary-hover data-[state=open]:!bg-bg-secondary-hover active:!bg-bg-secondary-active eink:ring-1 eink:ring-inset eink:ring-border eink:focus-visible:ring-2 coarse:h-12 coarse:w-12"
                >
                  {viewIcons[view]}
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="start" width={160}>
                <DropdownMenu.Label>View</DropdownMenu.Label>
                <DropdownMenu.Item
                  icon={<GridIcon16 />}
                  onSelect={() =>
                    navigate({
                      search: (prev) => ({ ...prev, view: "grid" }),
                      replace: true,
                    })
                  }
                  selected={view === "grid"}
                >
                  Grid
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<ListIcon16 />}
                  onSelect={() =>
                    navigate({
                      search: (prev) => ({ ...prev, view: "list" }),
                      replace: true,
                    })
                  }
                  selected={view === "list"}
                >
                  List
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton
                  aria-label="Sort"
                  className="h-10 w-10 rounded-lg bg-bg-secondary hover:!bg-bg-secondary-hover data-[state=open]:!bg-bg-secondary-hover active:!bg-bg-secondary-active eink:ring-1 eink:ring-inset eink:ring-border eink:focus-visible:ring-2 coarse:h-12 coarse:w-12"
                >
                  {sort === "count" ? <SortNumberDescIcon16 /> : <SortAlphabetAscIcon16 />}
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="start" width={160}>
                <DropdownMenu.Label>Sort</DropdownMenu.Label>
                <DropdownMenu.Item
                  icon={<SortAlphabetAscIcon16 />}
                  onSelect={() =>
                    navigate({
                      search: (prev) => ({ ...prev, sort: "name" }),
                      replace: true,
                    })
                  }
                  selected={sort === "name"}
                >
                  Name
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<SortNumberDescIcon16 />}
                  onSelect={() =>
                    navigate({
                      search: (prev) => ({ ...prev, sort: "count" }),
                      replace: true,
                    })
                  }
                  selected={sort === "count"}
                >
                  Count
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
            <SearchInput
              placeholder={`Search ${pluralize(sortedTagEntries.length, "tag")}…`}
              value={query ?? ""}
              onChange={(value) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    query: value,
                  }),
                })
              }
            />
          </div>
          {deferredQuery ? (
            <span className="text-sm text-text-secondary">
              {pluralize(searchResults.length, "result")}
            </span>
          ) : null}
        </div>
        {view === "grid" ? (
          <ul className="flex flex-wrap gap-y-3 gap-x-2">
            {searchResults.map(([tag, noteIds]) => (
              <li key={tag}>
                <PillButton asChild>
                  <Link to="/" search={{ query: `tag:${tag}`, view: "grid" }}>
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
  const [expanded, setExpanded] = useState(true)

  return (
    <li className="flex flex-col gap-3">
      <div className="flex items-center gap-0.5" style={{ paddingLeft: `calc(${depth} * 1.5rem)` }}>
        <PillButton asChild>
          <Link to="/" search={{ query: `tag:${[...path, node.name].join("/")}`, view: "grid" }}>
            {node.name}
            <span className="text-text-secondary">{node.count}</span>
          </Link>
        </PillButton>
        {node.children.length ? (
          <IconButton
            aria-label={expanded ? "Collapse" : "Expand"}
            disableTooltip
            size="small"
            className="size-6 p-0 coarse:size-8 coarse:p-0"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronRightIcon12 className={cx("transition-transform", expanded && "rotate-90")} />
          </IconButton>
        ) : null}
      </div>
      <div className={cx("empty:hidden", !expanded && "hidden")}>
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
