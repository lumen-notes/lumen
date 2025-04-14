import { useLocation, useMatch, useNavigate } from "@tanstack/react-router"
import { parseQuery } from "../hooks/search"
import { IconButton } from "./icon-button"
import { PlusIcon16 } from "./icons"

function useTagsFromRoute() {
  const tags = new Set<string>()

  const tagMatch = useMatch({ from: "/_appRoot/tags_/$", shouldThrow: false })
  if (tagMatch?.params._splat) {
    tags.add(tagMatch.params._splat)
  }

  const location = useLocation()
  const query = location.search.query ?? ""
  const tagQualifiers = parseQuery(query).qualifiers.filter((q) => q.key === "tag" && !q.exclude)

  tagQualifiers.forEach((qualifier) => {
    qualifier.values.forEach((tag) => tags.add(tag))
  })

  return Array.from(tags)
}

export function NewNoteButton() {
  const navigate = useNavigate()
  const tags = useTagsFromRoute()

  return (
    <IconButton
      aria-label="New note"
      shortcut={["⌘", "⇧", "O"]}
      size="small"
      onClick={() => {
        const noteId = `${Date.now()}`

        // Add tags to the note
        let content = ""
        if (tags.length > 0) {
          content = `---\ntags: [${tags.join(", ")}]\n---\n\n`
        }

        navigate({
          to: "/notes/$",
          params: { _splat: noteId },
          search: {
            mode: "write",
            query: undefined,
            view: "grid",
            content,
          },
        })
      }}
    >
      <PlusIcon16 />
    </IconButton>
  )
}
