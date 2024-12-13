import { Link, useNavigate } from "@tanstack/react-router"
import React, { useMemo, useState } from "react"
import { useInView } from "react-intersection-observer"
import { useDebounce } from "use-debounce"
import { parseQuery, useSearchNotes } from "../hooks/search"
import { formatNumber, pluralize } from "../utils/pluralize"
import { Button } from "./button"
import { Dice } from "./dice"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { GridIcon16, ListIcon16, PinFillIcon12, TagIcon16, XIcon12 } from "./icons"
import { LinkHighlightProvider } from "./link-highlight-provider"
import { NoteFavicon } from "./note-favicon"
import { NotePreviewCard } from "./note-preview-card"
import { PillButton } from "./pill-button"
import { SearchInput } from "./search-input"

type NoteListProps = {
  baseQuery?: string
  query: string
  view: "grid" | "list"
  onQueryChange: (query: string) => void
  onViewChange: (view: "grid" | "list") => void
}

const initialVisibleNotes = 10

export function NoteList({
  baseQuery = "",
  query,
  view,
  onQueryChange,
  onViewChange,
}: NoteListProps) {
  const searchNotes = useSearchNotes()
  const navigate = useNavigate()

  const [deferredQuery] = useDebounce(query, 150)

  const searchResults = useMemo(() => {
    return searchNotes(`${baseQuery} ${deferredQuery}`)
  }, [searchNotes, baseQuery, deferredQuery])

  const [numVisibleNotes, setNumVisibleNotes] = useState(initialVisibleNotes)

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

    const tags = searchResults.flatMap((note) => note.tags)

    for (const tag of tags) {
      frequencyMap.set(tag, (frequencyMap.get(tag) ?? 0) + 1)
    }

    const frequencyEntries = [...frequencyMap.entries()]

    return (
      frequencyEntries
        // Filter out tags that every note has
        .filter(([, frequency]) => frequency < searchResults.length)
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
  }, [searchResults])

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
                placeholder={`Search ${pluralize(searchResults.length, "note")}…`}
                value={query}
                onChange={(value) => {
                  onQueryChange(value)

                  // Reset the number of visible notes when the user starts typing
                  setNumVisibleNotes(initialVisibleNotes)
                }}
              />
              <IconButton
                aria-label={view === "grid" ? "List view" : "Grid view"}
                className="h-10 w-10 rounded-lg bg-bg-secondary hover:bg-bg-tertiary coarse:h-12 coarse:w-12"
                onClick={() => onViewChange(view === "grid" ? "list" : "grid")}
              >
                {view === "grid" ? <ListIcon16 /> : <GridIcon16 />}
              </IconButton>
              <DiceButton
                disabled={searchResults.length === 0}
                onClick={() => {
                  const resultsCount = searchResults.length
                  const randomIndex = Math.floor(Math.random() * resultsCount)
                  navigate({ to: `/notes/${searchResults[randomIndex].id}` })
                }}
              />
            </div>
            {deferredQuery ? (
              <span className="text-sm text-text-secondary">
                {pluralize(searchResults.length, "result")}
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
                      onQueryChange(newQuery.trim())

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
                    <XIcon12 className="-mr-0.5" />
                  </PillButton>
                ))}
                {sortedTagFrequencies.slice(0, numVisibleTags).map(([tag, frequency]) => (
                  <PillButton
                    key={tag}
                    data-tag={tag}
                    onClick={(event) => {
                      const qualifier = `${event.shiftKey ? "-" : ""}tag:${tag}`

                      onQueryChange(query ? `${query} ${qualifier}` : qualifier)

                      // Move focus
                      setTimeout(() => {
                        document.querySelector<HTMLElement>(`[data-tag="${tag}"]`)?.focus()
                      })
                    }}
                  >
                    {tag}
                    <span className="text-text-secondary">{formatNumber(frequency)}</span>
                  </PillButton>
                ))}
                {sortedTagFrequencies.length > numVisibleTags ? (
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <PillButton variant="dashed" className="data-[state=open]:bg-bg-secondary">
                        Show more
                      </PillButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      {sortedTagFrequencies.slice(numVisibleTags).map(([tag, frequency]) => (
                        <DropdownMenu.Item
                          key={tag}
                          icon={<TagIcon16 />}
                          trailingVisual={<span className="text-text-secondary">{frequency}</span>}
                          onClick={(event) => {
                            const qualifier = `${event.shiftKey ? "-" : ""}tag:${tag}`
                            onQueryChange(query ? `${query} ${qualifier}` : qualifier)
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
          {view === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {searchResults.slice(0, numVisibleNotes).map(({ id }) => (
                <NotePreviewCard key={id} id={id} />
              ))}
            </div>
          ) : null}
          {view === "list" ? (
            <ul>
              {searchResults.slice(0, numVisibleNotes).map((note) => {
                return (
                  <li key={note.id}>
                    <Link
                      to="/notes/$"
                      params={{ _splat: note.id }}
                      search={{
                        mode: "read",
                        query: undefined,
                        view: "grid",
                      }}
                      className="focus-ring flex h-10 items-center rounded-lg px-3 leading-4 hover:bg-bg-secondary coarse:h-12 coarse:p-4"
                    >
                      <NoteFavicon note={note} className="mr-3 coarse:mr-4" />
                      {note.pinned ? (
                        <PinFillIcon12 className="mr-2 flex-shrink-0 text-[var(--orange-11)]" />
                      ) : null}
                      <span className="truncate text-text-secondary">
                        <span className="text-text">{note.displayName}</span>
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
    </LinkHighlightProvider>
  )
}

function DiceButton({ disabled = false, onClick }: { disabled?: boolean; onClick?: () => void }) {
  const [number, setNumber] = React.useState(() => Math.floor(Math.random() * 6) + 1)
  return (
    <IconButton
      disabled={disabled}
      aria-label="Roll the dice"
      className="group/dice h-10 w-10 rounded-lg bg-bg-secondary hover:bg-bg-tertiary coarse:h-12 coarse:w-12"
      onClick={() => {
        setNumber(Math.floor(Math.random() * 6) + 1)
        onClick?.()
      }}
    >
      <Dice number={number} className="group-hover/dice:-rotate-12" />
    </IconButton>
  )
}
