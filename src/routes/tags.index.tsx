import { createFileRoute } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { useDeferredValue, useMemo } from "react"
import { AppLayout } from "../components/app-layout"
import { Link } from "../components/link"
import { PillButton } from "../components/pill-button"
import { SearchInput } from "../components/search-input"
import { sortedTagEntriesAtom, tagSearcherAtom } from "../global-state"
import { pluralize } from "../utils/pluralize"

type RouteSearch = {
  query: string | undefined
}

export const Route = createFileRoute("/tags/")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      query: typeof search.query === "string" ? search.query : undefined,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { query } = Route.useSearch()
  const navigate = Route.useNavigate()

  const sortedTagEntries = useAtomValue(sortedTagEntriesAtom)
  const tagSearcher = useAtomValue(tagSearcherAtom)

  const deferredQuery = useDeferredValue(query)

  const searchResults = useMemo(() => {
    return deferredQuery ? tagSearcher.search(deferredQuery) : sortedTagEntries
  }, [tagSearcher, deferredQuery, sortedTagEntries])

  const tagTree = useMemo(() => buildTagTree(searchResults), [searchResults])

  return (
    <AppLayout title="Tags">
      <div className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-2">
          <SearchInput
            placeholder={`Search ${pluralize(sortedTagEntries.length, "tag")}…`}
            value={query ?? ""}
            onChange={(value) => navigate({ search: { query: value }, replace: true })}
          />
          {deferredQuery ? (
            <span className="text-sm text-text-secondary">
              {pluralize(searchResults.length, "result")}
            </span>
          ) : null}
        </div>
        <TagTree tree={tagTree} />
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
  // const [isExpanded, setIsExpanded] = useState(true)

  return (
    <li className="flex flex-col gap-3">
      <div className="flex items-center gap-1" style={{ paddingLeft: `calc(${depth} * 1.5rem)` }}>
        <PillButton asChild>
          <Link to="/tags/$" params={{ _splat: [...path, node.name].join("/") }}>
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
