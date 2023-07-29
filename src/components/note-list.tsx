import React from "react"
import { useInView } from "react-intersection-observer"
import { z } from "zod"
import { templateSchema } from "../types"
import { pluralize } from "../utils/pluralize"
import { parseQuery, useSearchNotes } from "../utils/use-search-notes"
import { useSearchParam } from "../utils/use-search-param"
import { Button } from "./button"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { CardsIcon16, CloseIcon12, ListIcon16, TagIcon16 } from "./icons"
import { useLink } from "./link-context"
import { NoteCard } from "./note-card"
import { NoteFavicon } from "./note-favicon"
import { PillButton } from "./pill-button"
import { SearchInput } from "./search-input"

type NoteListProps = {
  baseQuery?: string
}

export function NoteList({ baseQuery = "" }: NoteListProps) {
  const searchNotes = useSearchNotes()

  const parseQueryParam = React.useCallback((value: unknown): string => {
    return typeof value === "string" ? value : ""
  }, [])

  const [query, setQuery] = useSearchParam("q", {
    defaultValue: "",
    schema: z.string(),
    parse: parseQueryParam,
    replace: true,
  })

  const deferredQuery = React.useDeferredValue(query)

  const searchResults = React.useMemo(() => {
    return searchNotes(`${baseQuery} ${deferredQuery}`)
  }, [searchNotes, baseQuery, deferredQuery])

  const parseViewType = React.useCallback((value: unknown): "list" | "cards" => {
    return value === "list" ? "list" : "cards"
  }, [])

  const [viewType, setViewType] = useSearchParam<"list" | "cards">("v", {
    defaultValue: "cards",
    schema: z.enum(["list", "cards"]),
    parse: parseViewType,
    replace: true,
  })

  const Link = useLink()

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10)

  const [bottomRef, bottomInView] = useInView()

  const loadMore = React.useCallback(() => {
    setNumVisibleNotes((num) => Math.min(num + 10, searchResults.length))
  }, [searchResults.length])

  React.useEffect(() => {
    if (bottomInView) {
      // Load more notes when the user scrolls to the bottom of the list
      loadMore()
    }
  }, [bottomInView, loadMore])

  const numVisibleTags = 4

  const sortedTagFrequencies = React.useMemo(() => {
    const frequencyMap = new Map<string, number>()

    for (const [, note] of searchResults) {
      for (const tag of note.tags) {
        frequencyMap.set(tag, (frequencyMap.get(tag) ?? 0) + 1)
      }
    }

    return (
      [...frequencyMap.entries()]
        // Filter out tags that every note has
        .filter(([, frequency]) => frequency < searchResults.length)
        .sort((a, b) => b[1] - a[1])
    )
  }, [searchResults])

  const tagQualifiers = React.useMemo(() => {
    return parseQuery(deferredQuery).qualifiers.filter((qualifier) => qualifier.key === "tag")
  }, [deferredQuery])

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <SearchInput
              placeholder={`Search ${pluralize(searchResults.length, "note")}…`}
              value={query}
              onChange={(value) => {
                setQuery(value)

                // Reset the number of visible notes when the user starts typing
                setNumVisibleNotes(10)
              }}
            />
            <IconButton
              aria-label={`Show as ${viewType === "list" ? "cards" : "list"}`}
              className="h-11 w-11 rounded-md bg-bg-secondary hover:bg-bg-tertiary coarse:h-12 coarse:w-12"
              onClick={() => {
                setViewType(viewType === "list" ? "cards" : "list")
              }}
            >
              {viewType === "list" ? <CardsIcon16 /> : <ListIcon16 />}
            </IconButton>
          </div>
          {deferredQuery ? (
            <span className="text-sm text-text-secondary">
              {pluralize(searchResults.length, "result")}
            </span>
          ) : null}
        </div>

        {sortedTagFrequencies.length > 0 || tagQualifiers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tagQualifiers.map((qualifier) => (
              <PillButton
                key={qualifier.values.join(",")}
                variant="primary"
                onClick={() => {
                  const text = `${qualifier.exclude ? "-" : ""}tag:${qualifier.values.join(",")}`

                  const index = query.indexOf(text)

                  if (index === -1) return

                  const newQuery =
                    query.slice(0, index) + query.slice(index + text.length).trimStart()

                  // Remove the tag qualifier from the query
                  setQuery(newQuery.trim())
                }}
              >
                {qualifier.exclude ? <span className="italic">not</span> : null}
                {qualifier.values.map((value, index) => (
                  <React.Fragment key={value}>
                    {index > 0 ? <span className="italic">or</span> : null}
                    <span key={value}>{value}</span>
                  </React.Fragment>
                ))}
                <CloseIcon12 className="-mr-0.5" />
              </PillButton>
            ))}
            {sortedTagFrequencies.slice(0, numVisibleTags).map(([tag, frequency]) => (
              <PillButton
                key={tag}
                onClick={(event) => {
                  const qualifier = `${event.shiftKey ? "-" : ""}tag:${tag}`
                  setQuery(query ? `${query} ${qualifier}` : qualifier)
                }}
              >
                {tag}
                <span className="text-text-secondary">{frequency}</span>
              </PillButton>
            ))}
            {sortedTagFrequencies.length > numVisibleTags ? (
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <PillButton variant="dashed">Show more</PillButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  {sortedTagFrequencies.slice(numVisibleTags).map(([tag, frequency]) => (
                    <DropdownMenu.Item
                      key={tag}
                      icon={<TagIcon16 />}
                      trailingVisual={<span className="text-text-secondary">{frequency}</span>}
                      onClick={(event) => {
                        const qualifier = `${event.shiftKey ? "-" : ""}tag:${tag}`
                        setQuery(query ? `${query} ${qualifier}` : qualifier)
                      }}
                    >
                      {tag}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}

        {viewType === "cards"
          ? searchResults.slice(0, numVisibleNotes).map(([id]) => <NoteCard key={id} id={id} />)
          : null}

        {viewType === "list" ? (
          <ul>
            {searchResults.slice(0, numVisibleNotes).map(([id, note]) => {
              const parsedTemplate = templateSchema
                .omit({ body: true })
                .safeParse(note.frontmatter.template)
              return (
                <li key={id}>
                  <Link
                    // Used for focus management
                    data-note-id={id}
                    to={`/${id}`}
                    target="_blank"
                    className="focus-ring flex gap-3 rounded-md p-3 leading-4 hover:bg-bg-secondary coarse:p-4"
                  >
                    <NoteFavicon note={note} />
                    <span className="truncate text-text-secondary">
                      <span className="text-text">
                        {parsedTemplate.success
                          ? `${parsedTemplate.data.name} template`
                          : note.title || id}
                      </span>
                      <span className="ml-2 ">
                        {note.tags
                          // Filter out tags that are parents of other tags
                          // Example: #foo #foo/bar -> #foo/bar
                          .filter((tag) => !note.tags.some((t) => t.startsWith(tag) && t !== tag))
                          .map((tag) => `#${tag}`)
                          .join(" ")}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      {searchResults.length > numVisibleNotes ? (
        <Button ref={bottomRef} className="mt-4 w-full" onClick={loadMore}>
          Load more
        </Button>
      ) : null}
    </div>
  )
}
