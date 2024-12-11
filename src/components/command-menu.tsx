import { useNavigate } from "@tanstack/react-router"
import { parseDate } from "chrono-node"
import { Command } from "cmdk"
import { useAtomValue } from "jotai"
import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { pinnedNotesAtom, tagSearcherAtom } from "../global-state"
import { useSaveNote } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { Note } from "../schema"
import { formatDate, formatDateDistance, toDateString, toWeekString } from "../utils/date"
import { checkIfPinned } from "../utils/pin"
import { pluralize } from "../utils/pluralize"
import {
  CalendarDateIcon16,
  CalendarIcon16,
  NoteIcon16,
  PinFillIcon12,
  PlusIcon16,
  SearchIcon16,
  SettingsIcon16,
  TagIcon16,
} from "./icons"
import { NoteFavicon } from "./note-favicon"

export function CommandMenu() {
  const navigate = useNavigate()

  const searchNotes = useSearchNotes()
  const tagSearcher = useAtomValue(tagSearcherAtom)
  const saveNote = useSaveNote()
  const pinnedNotes = useAtomValue(pinnedNotesAtom)

  // Refs
  const prevActiveElement = useRef<HTMLElement>()

  // Local state
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  const openMenu = useCallback(() => {
    prevActiveElement.current = document.activeElement as HTMLElement
    setIsOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      prevActiveElement.current?.focus()
    })
  }, [])

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }, [isOpen, openMenu, closeMenu])

  const handleSelect = useCallback((callback: () => void) => {
    return () => {
      setIsOpen(false)
      setQuery("")
      callback()
    }
  }, [])

  useHotkeys("mod+k", toggleMenu, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  })

  const navItems = useMemo(() => {
    return [
      {
        label: "Notes",
        icon: <NoteIcon16 />,
        onSelect: () => {
          navigate({
            to: "/",
            search: {
              query: undefined,
            },
          })
        },
      },
      {
        label: "Today",
        icon: <CalendarDateIcon16 date={new Date().getDate()} />,
        onSelect: () => {
          navigate({
            to: "/notes/$",
            params: {
              _splat: toDateString(new Date()),
            },
            search: {
              mode: "read",
              query: undefined,
            },
          })
        },
      },
      {
        label: "This week",
        icon: <CalendarIcon16 />,
        onSelect: () => {
          navigate({
            to: "/notes/$",
            params: {
              _splat: toWeekString(new Date()),
            },
            search: {
              mode: "read",
              query: undefined,
            },
          })
        },
      },
      {
        label: "Tags",
        icon: <TagIcon16 />,
        onSelect: () => {
          navigate({
            to: "/tags",
            search: {
              query: undefined,
            },
          })
        },
      },
      {
        label: "Settings",
        icon: <SettingsIcon16 />,
        onSelect: () => {
          navigate({
            to: "/settings",
          })
        },
      },
    ]
  }, [navigate])

  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      return item.label.toLowerCase().includes(deferredQuery.toLowerCase())
    })
  }, [navItems, deferredQuery])

  // Check if query can be parsed as a date
  const dateString = useMemo(() => {
    const date = parseDate(deferredQuery)
    if (!date) return ""
    return toDateString(date)
  }, [deferredQuery])

  // Search tags
  const tagResults = useMemo(() => {
    return tagSearcher.search(deferredQuery)
  }, [tagSearcher, deferredQuery])

  // Search notes
  const noteResults = useMemo(() => {
    return searchNotes(deferredQuery)
  }, [searchNotes, deferredQuery])

  // Only show the first 2 tags
  const numVisibleTags = 2

  // Only show the first 6 notes
  const numVisibleNotes = 6

  return (
    <Command.Dialog
      label="Global command menu"
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          openMenu()
        } else {
          closeMenu()
        }
      }}
      shouldFilter={false}
      onKeyDown={(event) => {
        // Clear input with `esc`
        if (event.key === "Escape" && query) {
          setQuery("")
          event.preventDefault()
        }
      }}
    >
      <div className="card-3 overflow-hidden">
        <Command.Input placeholder="Search or jump to…" value={query} onValueChange={setQuery} />
        <Command.List>
          {filteredNavItems.length ? (
            <Command.Group heading="Jump to">
              {filteredNavItems.map((item) => (
                <CommandItem
                  key={item.label}
                  icon={item.icon}
                  onSelect={handleSelect(item.onSelect)}
                >
                  {item.label}
                </CommandItem>
              ))}
            </Command.Group>
          ) : null}
          {!deferredQuery && pinnedNotes.length ? (
            <Command.Group heading="Pinned">
              {pinnedNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  // Since they're all pinned, we don't need to show the pin icon
                  pinned={false}
                  onSelect={handleSelect(() =>
                    navigate({
                      to: "/notes/$",
                      params: {
                        _splat: note.id,
                      },
                      search: {
                        mode: "read",
                        query: undefined,
                      },
                    }),
                  )}
                />
              ))}
            </Command.Group>
          ) : null}
          {dateString ? (
            <Command.Group heading="Date">
              <CommandItem
                key={dateString}
                icon={<CalendarDateIcon16 date={new Date(dateString).getUTCDate()} />}
                description={formatDateDistance(dateString)}
                onSelect={handleSelect(() => {
                  navigate({
                    to: "/notes/$",
                    params: {
                      _splat: dateString,
                    },
                    search: {
                      mode: "read",
                      query: undefined,
                    },
                  })
                })}
              >
                {formatDate(dateString)}
              </CommandItem>
            </Command.Group>
          ) : null}
          {tagResults.length ? (
            <Command.Group heading="Tags">
              {tagResults.slice(0, numVisibleTags).map(([name, noteIds]) => (
                <CommandItem
                  key={name}
                  icon={<TagIcon16 />}
                  description={pluralize(noteIds.length, "note")}
                  onSelect={handleSelect(() =>
                    navigate({
                      to: "/tags/$",
                      params: {
                        _splat: name,
                      },
                      search: {
                        query: undefined,
                      },
                    }),
                  )}
                >
                  {name}
                </CommandItem>
              ))}
              {tagResults.length > numVisibleTags ? (
                <CommandItem
                  key={`Show all tags matching "${deferredQuery}"`}
                  icon={<SearchIcon16 />}
                  onSelect={handleSelect(() =>
                    navigate({
                      to: "/tags/$",
                      params: {
                        _splat: deferredQuery,
                      },
                      search: {
                        query: undefined,
                      },
                    }),
                  )}
                >
                  Show all {pluralize(tagResults.length, "tag")} matching "{deferredQuery}"
                </CommandItem>
              ) : null}
            </Command.Group>
          ) : null}
          {deferredQuery ? (
            <Command.Group heading="Notes">
              {noteResults.slice(0, numVisibleNotes).map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  pinned={checkIfPinned(note.content)}
                  onSelect={handleSelect(() =>
                    navigate({
                      to: "/notes/$",
                      params: {
                        _splat: note.id,
                      },
                      search: {
                        mode: "read",
                        query: undefined,
                      },
                    }),
                  )}
                />
              ))}
              {noteResults.length > 0 ? (
                <CommandItem
                  key={`Show all notes matching "${deferredQuery}"`}
                  icon={<SearchIcon16 />}
                  onSelect={handleSelect(() =>
                    navigate({
                      to: "/",
                      search: {
                        query: deferredQuery,
                      },
                    }),
                  )}
                >
                  Show all {pluralize(noteResults.length, "note")} matching "{deferredQuery}"
                </CommandItem>
              ) : null}
              <CommandItem
                key={`Create new note "${deferredQuery}"`}
                icon={<PlusIcon16 />}
                onSelect={handleSelect(() => {
                  const note = {
                    id: Date.now().toString(),
                    content: `# ${deferredQuery}`,
                  }

                  // Create new note
                  saveNote(note)

                  // Navigate to new note
                  navigate({
                    to: "/notes/$",
                    params: {
                      _splat: note.id,
                    },
                    search: {
                      mode: "write",
                      query: undefined,
                    },
                  })
                })}
              >
                Create new note "{deferredQuery}"
              </CommandItem>
            </Command.Group>
          ) : null}
        </Command.List>
      </div>
    </Command.Dialog>
  )
}

type CommandItemProps = {
  children: React.ReactNode
  value?: string
  icon?: React.ReactNode
  description?: string
  onSelect?: () => void
}

function CommandItem({ children, value, icon, description, onSelect }: CommandItemProps) {
  return (
    <Command.Item value={value} onSelect={onSelect}>
      <div className="flex items-center gap-3">
        <div className="grid h-4 w-4 place-items-center text-text-secondary">{icon}</div>
        <div className="flex-grow truncate">{children}</div>
        {description ? (
          <span className="flex-shrink-0 text-text-secondary [[aria-selected]_&]:hidden">
            {description}
          </span>
        ) : null}
        <span className="hidden leading-none text-text-secondary [[aria-selected]_&]:inline">
          ⏎
        </span>
      </div>
    </Command.Item>
  )
}

function NoteItem({
  note,
  pinned,
  onSelect,
}: {
  note: Note
  pinned: boolean
  onSelect: () => void
}) {
  return (
    <CommandItem
      key={note.id}
      value={note.id}
      icon={<NoteFavicon note={note} />}
      onSelect={onSelect}
    >
      <span className="flex items-center gap-2 truncate">
        {pinned ? <PinFillIcon12 className="flex-shrink-0 text-[var(--orange-11)]" /> : null}
        <span className="truncate">{note.displayName}</span>
      </span>
    </CommandItem>
  )
}
