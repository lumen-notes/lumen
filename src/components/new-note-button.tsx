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

  return (
    <IconButton
      aria-label="New note"
      shortcut={["⌘", "⇧", "O"]}
      size={size}
      onClick={() => {
        const noteId = `${Date.now()}`
        let content = ""

        // Add tag from URL path
        if (pathTag) {
          content += `#${pathTag}`
        }

        // Add tags from search qualifiers
        const searchTags = tagQualifiers.flatMap((q) => q.values)
        if (searchTags.length > 0) {
          if (content) content += " "
          content += searchTags.map((t) => `#${t}`).join(" ")
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
