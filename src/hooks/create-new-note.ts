import { useLocation, useMatch, useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import { parseQuery } from "../utils/search"

function useTagsFromRoute() {
  const tags = new Set<string>()

  const tagMatch = useMatch({ from: "/_appRoot/tags_/$", shouldThrow: false })
  if (tagMatch?.params._splat) {
    tags.add(tagMatch.params._splat)
  }

  const location = useLocation()
  const query = location.search.query ?? ""
  const tagFilters = parseQuery(query).filters.filter((q) => q.key === "tag" && !q.exclude)

  tagFilters.forEach((filter) => {
    filter.values.forEach((tag) => tags.add(tag))
  })

  return Array.from(tags)
}

export function useCreateNewNote() {
  const navigate = useNavigate()
  const tags = useTagsFromRoute()

  return useCallback(() => {
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
        content: content || undefined,
      },
    })
  }, [navigate, tags])
}
