import React from "react"
import { flushSync } from "react-dom"
import { useInView } from "react-intersection-observer"
import { Link, useNavigate } from "react-router-dom"
import { z } from "zod"
import { useDebouncedValue } from "../hooks/debounced-value"
import { parseQuery, useSearchNotes } from "../hooks/search"
import { useSearchParam } from "../hooks/search-param"
import { templateSchema } from "../schema"
import { removeLeadingEmoji } from "../utils/emoji"
import { checkIfPinned } from "../utils/pin"
import { pluralize } from "../utils/pluralize"
import { Button } from "./button"
import { Dice } from "./dice"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { CloseIcon12, GridIcon16, ListIcon16, PinFillIcon12, TagIcon16 } from "./icons"
import { LinkHighlightProvider } from "./link-highlight-provider"
import { NoteFavicon } from "./note-favicon"
import { NotePreviewCard } from "./note-preview-card"
import { PillButton } from "./pill-button"
import { SearchInput } from "./search-input"

const viewTypeSchema = z.enum(["list", "grid"])

type ViewType = z.infer<typeof viewTypeSchema>

type NoteListProps = {
  baseQuery?: string
  initialVisibleNotes?: number
}
export function NoteList({ baseQuery = "", initialVisibleNotes = 10 }: NoteListProps) {
  const searchNotes = useSearchNotes()
  const navigate = useNavigate()

  const [query, setQuery] = useSearchParam("query", {
    validate: z.string().catch("").parse,
    replace: true,
  })

  const [debouncedQuery] = useDebouncedValue(query, 200, { leading: true })

  const noteResults = React.useMemo(() => {
    return searchNotes(`${baseQuery} ${debouncedQuery}`)
  }, [searchNotes, baseQuery, debouncedQuery])

  const [viewType, setViewType] = useSearchParam<ViewType>("view", {
    validate: viewTypeSchema.catch("grid").parse,
    replace: true,
  })

  // Only render the first 24 notes when the page loads
  const [numVisibleNotes, setNumVisibleNotes] = React.useState(initialVisibleNotes)

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
                  setNumVisibleNotes(initialVisibleNotes)
                }}
              />
              <IconButton
                aria-label={viewType === "grid" ? "List view" : "Grid view"}
                className="h-10 w-10 rounded-md bg-bg-secondary hover:bg-bg-tertiary coarse:h-12 coarse:w-12"
                onClick={() => setViewType(viewType === "grid" ? "list" : "grid")}
              >
                {viewType === "grid" ? <ListIcon16 /> : <GridIcon16 />}
              </IconButton>
              <DiceButton
                disabled={noteResults.length === 0}
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
                    {qualifier.exclude ? <span className="italic">not</span> : null}
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
          {viewType === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {noteResults.slice(0, numVisibleNotes).map(({ id }) => (
                <NotePreviewCard key={id} id={id} />
              ))}
            </div>
          ) : null}
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
                      className="focus-ring flex items-center rounded-md p-3 leading-4 hover:bg-bg-secondary coarse:p-4"
                      // target="_blank"
                    >
                      <NoteFavicon note={note} className="mr-3" />
                      {checkIfPinned(note) ? (
                        <PinFillIcon12 className="mr-2 flex-shrink-0 text-[var(--orange-11)]" />
                      ) : null}
                      <span className="truncate text-text-secondary">
                        <span className="text-text">
                          {parsedTemplate.success
                            ? `${parsedTemplate.data.name} template`
                            : removeLeadingEmoji(note.title) || note.id}
                        </span>
                        {/* <span className="ml-2">
                          {removeParentTags(note.tags)
                            .map((tag) => `#${tag}`)
                            .join(" ")}
                        </span> */}
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
    >
      <Dice number={number} angle={angle} className="group-active/dice:-translate-y-1" />
    </IconButton>
  )
}
