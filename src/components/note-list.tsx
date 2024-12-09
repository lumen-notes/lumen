import { Link, useNavigate, useSearch } from "@tanstack/react-router"
import React, { useDeferredValue, useMemo, useState } from "react"
import { flushSync } from "react-dom"
import { useInView } from "react-intersection-observer"
import { parseQuery, useSearchNotes } from "../hooks/search"
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

type NoteListProps = {
  baseQuery?: string
  initialVisibleNotes?: number
}

export function NoteList({ baseQuery = "", initialVisibleNotes = 10 }: NoteListProps) {
  const searchNotes = useSearchNotes()
  const navigate = useNavigate()
  const searchParams = useSearch({ strict: false })

  const [query, setQuery] = useState("")

  const deferredQuery = useDeferredValue(query)

  const defurredQuery = useMemo(() => {
    return searchNotes(`${baseQuery} ${deferredQuery}`)
  }, [searchNotes, baseQuery, deferredQuery])

  const [layout, setLayout] = useState<"grid" | "list">("grid")

  const [numVisibleNotes, setNumVisibleNotes] = useState(initialVisibleNotes)

  const [bottomRef, bottomInView] = useInView()

  const loadMore = React.useCallback(() => {
    setNumVisibleNotes((num) => Math.min(num + 10, defurredQuery.length))
  }, [defurredQuery.length])

  React.useEffect(() => {
    if (bottomInView) {
      // Load more notes when the user scrolls to the bottom of the list
      loadMore()
    }
  }, [bottomInView, loadMore])

  const numVisibleTags = 4

  const sortedTagFrequencies = React.useMemo(() => {
    const frequencyMap = new Map<string, number>()

    const tags = defurredQuery.flatMap((note) => note.tags)

    for (const tag of tags) {
      frequencyMap.set(tag, (frequencyMap.get(tag) ?? 0) + 1)
    }

    const frequencyEntries = [...frequencyMap.entries()]

    return (
      frequencyEntries
        // Filter out tags that every note has
        .filter(([, frequency]) => frequency < defurredQuery.length)
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
  }, [defurredQuery])

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
                placeholder={`Search ${pluralize(defurredQuery.length, "note")}…`}
                value={query}
                onChange={(value) => {
                  setQuery(value)

                  // Reset the number of visible notes when the user starts typing
                  setNumVisibleNotes(initialVisibleNotes)
                }}
              />
              <IconButton
                aria-label={layout === "grid" ? "View as list" : "View as grid"}
                className="h-10 w-10 rounded-lg bg-bg-secondary hover:bg-bg-tertiary coarse:h-12 coarse:w-12"
                onClick={() => setLayout(layout === "grid" ? "list" : "grid")}
              >
                {layout === "grid" ? <ListIcon16 /> : <GridIcon16 />}
              </IconButton>
              <DiceButton
                disabled={defurredQuery.length === 0}
                onClick={() => {
                  const resultsCount = defurredQuery.length
                  const randomIndex = Math.floor(Math.random() * resultsCount)
                  navigate({ to: `/notes/${defurredQuery[randomIndex].id}` })
                }}
              />
            </div>
            {query ? (
              <span className="text-sm text-text-secondary">
                {pluralize(defurredQuery.length, "result")}
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
          {layout === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {defurredQuery.slice(0, numVisibleNotes).map(({ id }) => (
                <NotePreviewCard key={id} id={id} />
              ))}
            </div>
          ) : null}
          {layout === "list" ? (
            <ul>
              {defurredQuery.slice(0, numVisibleNotes).map((note) => {
                const parsedTemplate = templateSchema
                  .omit({ body: true })
                  .safeParse(note.frontmatter.template)
                return (
                  // TODO: Move this into a NoteItem component
                  <li key={note.id}>
                    <Link
                      to="/notes/$"
                      params={{ _splat: note.id }}
                      search={{
                        mode: "read",
                        width: searchParams.width === "fill" ? "fill" : "fixed",
                      }}
                      className="focus-ring flex items-center rounded-lg p-3 leading-4 hover:bg-bg-secondary coarse:p-4"
                    >
                      <NoteFavicon note={note} className="mr-3" />
                      {checkIfPinned(note.content) ? (
                        <PinFillIcon12 className="mr-2 flex-shrink-0 text-[var(--orange-11)]" />
                      ) : null}
                      <span className="truncate text-text-secondary">
                        <span className="text-text">
                          {parsedTemplate.success
                            ? `${parsedTemplate.data.name} template`
                            : removeLeadingEmoji(note.title) || note.id}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        {defurredQuery.length > numVisibleNotes ? (
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
      className="group/dice h-10 w-10 rounded-lg bg-bg-secondary hover:bg-bg-tertiary coarse:h-12 coarse:w-12"
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
