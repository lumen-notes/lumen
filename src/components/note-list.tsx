import { Link, useNavigate } from "@tanstack/react-router"
import React, { useMemo, useState } from "react"
import { useInView } from "react-intersection-observer"
import { useDebounce } from "use-debounce"
import { useSearchNotes } from "../hooks/search-notes"
import { parseQuery } from "../utils/search"
import { formatNumber, pluralize } from "../utils/pluralize"
import { Button } from "./button"
import { Dice } from "./dice"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import {
  GlobeIcon16,
  GridIcon16,
  ListIcon16,
  PinFillIcon12,
  TagFillIcon12,
  TagIcon12,
  TagIcon16,
  XIcon12,
} from "./icons"
import { LinkHighlightProvider } from "./link-highlight-provider"
import { NoteFavicon } from "./note-favicon"
import { NotePreviewCard } from "./note-preview-card"
import { PillButton } from "./pill-button"
import { SearchInput } from "./search-input"

type View = "grid" | "list"

const viewIcons: Record<View, React.ReactNode> = {
  grid: <GridIcon16 />,
  list: <ListIcon16 />,
}

type NoteListProps = {
  baseQuery?: string
  query: string
  view: View
  onQueryChange: (query: string) => void
  onViewChange: (view: View) => void
}

const initialVisibleItems = 10

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

  const noteResults = useMemo(() => {
    return searchNotes(`${baseQuery} ${deferredQuery}`)
  }, [searchNotes, baseQuery, deferredQuery])

  const [numVisibleItems, setNumVisibleItems] = useState(initialVisibleItems)

  const [bottomRef, bottomInView] = useInView()

  const loadMore = React.useCallback(() => {
    setNumVisibleItems((num) => Math.min(num + 10, noteResults.length))
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

    const tags = noteResults.flatMap((result) => result.tags)

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

  const filters = React.useMemo(() => {
    return parseQuery(query).filters
  }, [query])

  const tagFilters = React.useMemo(() => {
    return filters.filter((filter) => filter.key === "tag")
  }, [filters])

  const highlightPaths = React.useMemo(() => {
    return filters
      .filter((filter) => !filter.exclude)
      .flatMap((filter) => {
        switch (filter.key) {
          case "tag":
            return filter.values.map((value) => `/tags/${value}`)
          case "link":
            return filter.values.map((value) => `/${value}`)
          case "date":
            return filter.values.map((value) => `/${value}`)
          default:
            return []
        }
      })
  }, [filters])

  return (
    <LinkHighlightProvider href={highlightPaths}>
      <div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <SearchInput
              placeholder={`Search ${pluralize(noteResults.length, "note")}…`}
              value={query}
              autoCapitalize="off"
              spellCheck="false"
              onChange={(value) => {
                onQueryChange(value)

                // Reset the number of visible notes when the user starts typing
                setNumVisibleItems(initialVisibleItems)
              }}
            />
            <DiceButton
              disabled={noteResults.length === 0}
              onClick={() => {
                const resultsCount = noteResults.length
                const randomIndex = Math.floor(Math.random() * resultsCount)
                navigate({ to: `/notes/${noteResults[randomIndex].id}` })
              }}
            />
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton
                  aria-label="View"
                  className="h-10 w-10 shrink-0 rounded-lg bg-bg-secondary hover:!bg-bg-secondary-hover data-[state=open]:!bg-bg-secondary-hover active:!bg-bg-secondary-active eink:ring-1 eink:ring-inset eink:ring-border eink:focus-visible:ring-2 coarse:h-12 coarse:w-12"
                >
                  {viewIcons[view]}
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" width={160}>
                <DropdownMenu.Label>View as</DropdownMenu.Label>
                <DropdownMenu.Item
                  icon={<GridIcon16 />}
                  onSelect={() => onViewChange("grid")}
                  selected={view === "grid"}
                >
                  Grid
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<ListIcon16 />}
                  onSelect={() => onViewChange("list")}
                  selected={view === "list"}
                >
                  List
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
          {sortedTagFrequencies.length > 0 || tagFilters.length > 0 || deferredQuery ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 empty:hidden">
                {sortedTagFrequencies.length > 0 || tagFilters.length > 0 ? (
                  <>
                    {tagFilters.map((filter) => (
                      <PillButton
                        key={filter.values.join(",")}
                        data-tag={filter.values.join(",")}
                        variant="primary"
                        onClick={() => {
                          const text = `${filter.exclude ? "-" : ""}tag:${filter.values.join(",")}`

                          const index = query.indexOf(text)

                          if (index === -1) return

                          const newQuery =
                            query.slice(0, index) + query.slice(index + text.length).trimStart()

                          // Remove the tag qualifier from the query
                          onQueryChange(newQuery.trim())

                          // TODO: Move focus
                        }}
                      >
                        <TagFillIcon12 />
                        {filter.exclude ? <span className="italic">not</span> : null}
                        {filter.values.map((value, index) => (
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
                        <TagIcon12 className="text-text-secondary" />
                        {tag}
                        <span className="text-text-secondary">{formatNumber(frequency)}</span>
                      </PillButton>
                    ))}
                    {sortedTagFrequencies.length > numVisibleTags ? (
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <PillButton variant="dashed" className="data-[state=open]:bg-bg-hover">
                            More…
                          </PillButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content width={300}>
                          {sortedTagFrequencies.slice(numVisibleTags).map(([tag, frequency]) => (
                            <DropdownMenu.Item
                              key={tag}
                              icon={<TagIcon16 />}
                              trailingVisual={
                                <span className="text-text-secondary eink:text-current">
                                  {frequency}
                                </span>
                              }
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
              {deferredQuery ? (
                <div className="text-sm text-text-secondary leading-4">
                  {pluralize(noteResults.length, "result")}
                </div>
              ) : null}
            </div>
          ) : null}
          {view === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {noteResults.slice(0, numVisibleItems).map(({ id }) => (
                <NotePreviewCard key={id} id={id} />
              ))}
            </div>
          ) : null}
          {view === "list" ? (
            <ul className="flex flex-col gap-0.5">
              {noteResults.slice(0, numVisibleItems).map((note) => {
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
                      className="focus-ring flex h-10 items-center rounded-lg px-3 hover:bg-bg-hover coarse:h-12 coarse:p-4"
                    >
                      <NoteFavicon note={note} className="mr-3 coarse:mr-4" />
                      {note.pinned ? (
                        <PinFillIcon12 className="mr-2 coarse:mr-3 flex-shrink-0 text-text-pinned" />
                      ) : null}
                      {note?.frontmatter?.gist_id ? (
                        <GlobeIcon16 className="mr-2 coarse:mr-3 flex-shrink-0 text-border-focus" />
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

        {noteResults.length > numVisibleItems ? (
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
      className="group/dice h-10 w-10 shrink-0 rounded-lg bg-bg-secondary hover:!bg-bg-secondary-hover active:!bg-bg-secondary-active eink:ring-1 eink:ring-inset eink:ring-border eink:focus-visible:ring-2 coarse:h-12 coarse:w-12"
      onClick={() => {
        setNumber(Math.floor(Math.random() * 6) + 1)
        onClick?.()
      }}
    >
      <Dice
        number={number}
        className="group-hover/dice:rotate-[20deg] group-active/dice:rotate-[100deg] group-hover/dice:-translate-y-0.5"
      />
    </IconButton>
  )
}
