import React from "react"
import { flushSync } from "react-dom"
import { useInView } from "react-intersection-observer"
import { z } from "zod"
import { useDebouncedValue } from "../hooks/debounced-value"
import { useNavigateWithCache } from "../hooks/navigate-with-cache"
import { parseQuery, useSearchNotes } from "../hooks/search"
import { useSearchParam } from "../hooks/search-param"
import { templateSchema } from "../schema"
import { pluralize } from "../utils/pluralize"
import { removeParentTags } from "../utils/remove-parent-tags"
import { Button } from "./button"
import { Dice } from "./dice"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { CardsIcon16, CloseIcon12, ListIcon16, TagIcon16 } from "./icons"
import { Link } from "./link"
import { LinkHighlightProvider } from "./link-highlight-provider"
import { NoteCard } from "./note-card"
import { NoteFavicon } from "./note-favicon"
import { PillButton } from "./pill-button"
import { SearchInput } from "./search-input"

const viewTypeSchema = z.enum(["list", "cards"])

type ViewType = z.infer<typeof viewTypeSchema>

type NoteListProps = {
  baseQuery?: string
}
export function NoteList({ baseQuery = "" }: NoteListProps) {
  const searchNotes = useSearchNotes()
  const navigate = useNavigateWithCache()

  const [query, setQuery] = useSearchParam("q", {
    validate: z.string().catch("").parse,
    replace: true,
  })

  const [debouncedQuery] = useDebouncedValue(query, 200, { leading: true })

  const noteResults = React.useMemo(() => {
    return searchNotes(`${baseQuery} ${debouncedQuery}`)
  }, [searchNotes, baseQuery, debouncedQuery])

  const [viewType, setViewType] = useSearchParam<ViewType>("v", {
    validate: viewTypeSchema.catch("cards").parse,
    replace: true,
  })

  // Only render the first 10 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(10)

  const [bottomRef, bottomInView] = useInView()

  const loadMore = React.useCallback(() => {
    setNumVisibleNotes((num) => Math.min(num + 10, noteResults.length))
  }, [noteResults.length])

  React.useEffect(() => {
    if (bottomInView) {
      // Load more notes when the user scrolls to the bottom of the list
      loadMore()
    }
  }, [bottomInView, loadMore])

  const numVisibleTags = 4

  const sortedTagFrequencies = React.useMemo(() => {
    const frequencyMap = new Map<string, number>()

    const tags = noteResults.flatMap((note) => note.tags)

    for (const tag of tags) {
      frequencyMap.set(tag, (frequencyMap.get(tag) ?? 0) + 1)
    }

    const frequencyEntries = [...frequencyMap.entries()]

    return (
      frequencyEntries
        // Filter out tags that every note has
        .filter(([, frequency]) => frequency < noteResults.length)
        // Filter out parent tags if the all the childs tag has the same frequency
        .filter(([tag, frequency]) => {
          const childTags = frequencyEntries.filter(
            ([otherTag]) => otherTag !== tag && otherTag.startsWith(tag),
          )

          if (childTags.length === 0) return true

          return !childTags.every(([, otherFrequency]) => otherFrequency === frequency)
        })
        .sort((a, b) => {
          return b[1] - a[1]
        })
    )
  }, [noteResults])

  const qualifiers = React.useMemo(() => {
    return parseQuery(query).qualifiers
  }, [query])

  const tagQualifiers = React.useMemo(() => {
    return qualifiers.filter((qualifier) => qualifier.key === "tag")
  }, [qualifiers])

  const highlightPaths = React.useMemo(() => {
    return qualifiers
      .filter((qualifier) => !qualifier.exclude)
      .flatMap((qualifier) => {
        switch (qualifier.key) {
          case "tag":
            return qualifier.values.map((value) => `/tags/${value}`)
          case "link":
            return qualifier.values.map((value) => `/${value}`)
          case "date":
            return qualifier.values.map((value) => `/${value}`)
          default:
            return []
        }
      })
  }, [qualifiers])

  return (
    <LinkHighlightProvider href={highlightPaths}>
      <div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <SearchInput
                placeholder={`Search ${pluralize(noteResults.length, "note")}…`}
                value={query}
                onChange={(value) => {
                  setQuery(value)

                  // Reset the number of visible notes when the user starts typing
                  setNumVisibleNotes(10)
                }}
              />
              <IconButton
                aria-label={viewType === "cards" ? "List view" : "Card view"}
                className="h-10 w-10 rounded-md bg-bg-secondary hover:bg-bg-tertiary coarse:h-12 coarse:w-12"
                onClick={() => setViewType(viewType === "cards" ? "list" : "cards")}
              >
                {viewType === "cards" ? <ListIcon16 /> : <CardsIcon16 />}
              </IconButton>
              <DiceButton
                onClick={() => {
                  const resultsCount = noteResults.length
                  const randomIndex = Math.floor(Math.random() * resultsCount)
                  navigate(`/${noteResults[randomIndex].id}`)
                }}
              />
            </div>
            {query ? (
              <span className="text-sm text-text-secondary">
                {pluralize(noteResults.length, "result")}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 empty:hidden">
            {sortedTagFrequencies.length > 0 || tagQualifiers.length > 0 ? (
              <>
                {tagQualifiers.map((qualifier) => (
                  <PillButton
                    key={qualifier.values.join(",")}
                    data-tag={qualifier.values.join(",")}
                    variant="primary"
                    onClick={() => {
                      const text = `${qualifier.exclude ? "-" : ""}tag:${qualifier.values.join(
                        ",",
                      )}`

                      const index = query.indexOf(text)

                      if (index === -1) return

                      const newQuery =
                        query.slice(0, index) + query.slice(index + text.length).trimStart()

                      // Remove the tag qualifier from the query
                      setQuery(newQuery.trim())

                      // TODO: Move focus
                    }}
                  >
                    {qualifier.exclude ? <span>not</span> : null}
                    {qualifier.values.map((value, index) => (
                      <React.Fragment key={value}>
                        {index > 0 ? <span>or</span> : null}
                        <span key={value}>{value}</span>
                      </React.Fragment>
                    ))}
                    <CloseIcon12 className="-mr-0.5" />
                  </PillButton>
                ))}
                {sortedTagFrequencies.slice(0, numVisibleTags).map(([tag, frequency]) => (
                  <PillButton
                    key={tag}
                    data-tag={tag}
                    onClick={(event) => {
                      const qualifier = `${event.shiftKey ? "-" : ""}tag:${tag}`

                      flushSync(() => {
                        setQuery(query ? `${query} ${qualifier}` : qualifier)
                      })

                      // Move focus
                      document.querySelector<HTMLElement>(`[data-tag="${tag}"]`)?.focus()
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
              </>
            ) : null}
          </div>
          {viewType === "cards"
            ? noteResults.slice(0, numVisibleNotes).map(({ id }) => <NoteCard key={id} id={id} />)
            : null}
          {viewType === "list" ? (
            <ul>
              {noteResults.slice(0, numVisibleNotes).map((note) => {
                const parsedTemplate = templateSchema
                  .omit({ body: true })
                  .safeParse(note.frontmatter.template)
                return (
                  // TODO: Move this into a NoteItem component
                  <li key={note.id}>
                    <Link
                      // Used for focus management
                      data-note-id={note.id}
                      to={`/${note.id}`}
                      className="focus-ring flex gap-3 rounded-md p-3 leading-4 hover:bg-bg-secondary coarse:p-4"
                    >
                      <NoteFavicon note={note} />
                      <span className="truncate text-text-secondary">
                        <span className="text-text">
                          {parsedTemplate.success
                            ? `${parsedTemplate.data.name} template`
                            : note.title || note.id}
                        </span>
                        <span className="ml-2 ">
                          {removeParentTags(note.tags)
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

        {noteResults.length > numVisibleNotes ? (
          <Button ref={bottomRef} className="mt-4 w-full" onClick={loadMore}>
            Load more
          </Button>
        ) : null}
      </div>
    </LinkHighlightProvider>
  )
}

function DiceButton({ disabled = false, onClick }: { disabled?: boolean; onClick?: () => void }) {
  const [angle, setAngle] = React.useState(0)
  const [number, setNumber] = React.useState(() => Math.floor(Math.random() * 6) + 1)
  const [isHovered, setIsHovered] = React.useState(false)
  return (
    <IconButton
      disabled={disabled}
      aria-label="Roll the dice"
      className="group/dice h-10 w-10 rounded-md bg-bg-secondary hover:bg-bg-tertiary coarse:h-12 coarse:w-12"
      onClick={() => {
        setAngle((angle) => angle + 180)
        setNumber(Math.floor(Math.random() * 6) + 1)
        onClick?.()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Dice number={number} angle={isHovered ? angle + 90 : angle} />
    </IconButton>
  )
}
