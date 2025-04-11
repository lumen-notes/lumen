import { useLocation, useNavigate } from "@tanstack/react-router"
import { IconButton } from "./icon-button"
import { PlusIcon16 } from "./icons"
import { useSaveNote } from "../hooks/note"
import { Route as RootRoute } from "../routes/_appRoot.index"
import { parseQuery } from "../hooks/search"

export type NewNoteButtonProps = {
  size?: "small" | "medium"
}

export function NewNoteButton({ size = "small" }: NewNoteButtonProps) {
  const navigate = useNavigate()
  const saveNote = useSaveNote()
  const location = useLocation()

  // Get the tag from /tags/[tag] path
  const pathTag = location.pathname.split("/tags/")[1]

  // Get tags from search query
  let query = ""
  try {
    const { query: routeQuery = "" } = RootRoute.useSearch()
    query = routeQuery
  } catch {
    // If route search is not available, continue with empty query
  }
  const tagQualifiers = parseQuery(query).qualifiers.filter((q) => q.key === "tag" && !q.exclude)

  // Collect all tags
  const tags = new Set<string>()
  if (pathTag) {
    tags.add(pathTag)
  }
  tagQualifiers.forEach((qualifier) => {
    qualifier.values.forEach((tag) => tags.add(tag))
  })

  return (
    <IconButton
      aria-label="New note"
      shortcut={["⌘", "⇧", "O"]}
      size={size}
      onClick={() => {
        const noteId = `${Date.now()}`

        // Create frontmatter if we have tags
        let content = ""
        if (tags.size > 0) {
          content = `---\ntags: [${Array.from(tags).join(", ")}]\n---\n\n`
        }

        const note = {
          id: noteId,
          content,
        }
        saveNote(note)

        navigate({
          to: "/notes/$",
          params: { _splat: noteId },
          search: {
            mode: "write",
            query: undefined,
            view: "grid",
          },
        })
      }}
    >
      <PlusIcon16 />
    </IconButton>
  )
}
