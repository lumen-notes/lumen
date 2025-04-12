import { useNavigate } from "@tanstack/react-router"
import { parseDate } from "chrono-node"
import { Command } from "cmdk"
import copy from "copy-to-clipboard"
import { atom, useAtom, useAtomValue } from "jotai"
import { selectAtom, useAtomCallback } from "jotai/utils"
import { useCallback, useMemo, useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useDebounce } from "use-debounce"
import { githubRepoAtom, notesAtom, pinnedNotesAtom, tagSearcherAtom } from "../global-state"
import { useNoteById, useSaveNote } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { Note } from "../schema"
import { formatDate, formatDateDistance, toDateString, toWeekString } from "../utils/date"
import { pluralize } from "../utils/pluralize"

import { useMatches } from "@tanstack/react-router"
import {
  CalendarDateIcon16,
  CalendarIcon16,
  CopyIcon16,
  ExternalLinkIcon16,
  GlobeIcon16,
  NoteIcon16,
  PinFillIcon12,
  PlusIcon16,
  PrinterIcon16,
  SearchIcon16,
  SettingsIcon16,
  TagIcon16,
} from "./icons"
import { NoteFavicon } from "./note-favicon"

export const isCommandMenuOpenAtom = atom(false)

const hasDailyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toDateString(new Date())))
const hasWeeklyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toWeekString(new Date())))

export function CommandMenu() {
  const navigate = useNavigate()
  const githubRepo = useAtomValue(githubRepoAtom)
  const searchNotes = useSearchNotes()
  const tagSearcher = useAtomValue(tagSearcherAtom)
  const saveNote = useSaveNote()
  const pinnedNotes = useAtomValue(pinnedNotesAtom)
  const getHasDailyNote = useAtomCallback(useCallback((get) => get(hasDailyNoteAtom), []))
  const getHasWeeklyNote = useAtomCallback(useCallback((get) => get(hasWeeklyNoteAtom), []))
  const [isOpen, setIsOpen] = useAtom(isCommandMenuOpenAtom)

  // Get the current note if we're on a note page.
  // This is used to show note actions in the command menu.
  const matches = useMatches()
  const noteMatch = matches.find((match) => match.fullPath === "/notes/$")
  const noteId = noteMatch?.params._splat
  const note = useNoteById(noteId)

  // Refs
  const prevActiveElement = useRef<HTMLElement>()

  // Local state
  const [query, setQuery] = useState("")
  const [deferredQuery] = useDebounce(query, 150)

  const openMenu = useCallback(() => {
    prevActiveElement.current = document.activeElement as HTMLElement
    setIsOpen(true)
  }, [setIsOpen])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      prevActiveElement.current?.focus()
    })
  }, [setIsOpen])

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }, [isOpen, openMenu, closeMenu])

  const handleSelect = useCallback(
    (callback: () => void) => {
      return () => {
        setIsOpen(false)
        setQuery("")
        callback()
      }
    },
    [setIsOpen],
  )

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
              view: "grid",
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
              mode: getHasDailyNote() ? "read" : "write",
              query: undefined,
              view: "grid",
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
              mode: getHasWeeklyNote() ? "read" : "write",
              query: undefined,
              view: "grid",
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
  }, [navigate, getHasDailyNote, getHasWeeklyNote])

  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      return item.label.toLowerCase().includes(deferredQuery.toLowerCase())
    })
  }, [navItems, deferredQuery])

  const noteActions = useMemo(() => {
    if (!note) return []
    return [
      // TODO: Get the codemirror instance and update the editor value when pinning/unpinning
      // {
      //   label: note.pinned ? "Unpin note" : "Pin note",
      //   icon: note.pinned ? <PinFillIcon16 className="text-text-pinned" /> : <PinIcon16 />,
      //   onSelect: () => {
      //     saveNote({
      //       id: note.id,
      //       content: updateFrontmatter({
      //         content: note.content,
      //         properties: { pinned: note.pinned ? null : true },
      //       }),
      //     })
      //   },
      // },
      {
        label: "Copy note markdown",
        icon: <CopyIcon16 />,
        onSelect: () => {
          copy(note.content)
        },
      },
      {
        label: "Copy note ID",
        icon: <CopyIcon16 />,
        onSelect: () => {
          copy(note.id)
        },
      },
      {
        label: "Open in GitHub",
        icon: <ExternalLinkIcon16 />,
        onSelect: () => {
          if (!githubRepo) return
          const url = `https://github.com/${githubRepo.owner}/${githubRepo.name}/blob/main/${note.id}.md`
          window.open(url, "_blank")
        },
      },
      {
        label: "Print note",
        icon: <PrinterIcon16 />,
        onSelect: () => {
          window.print()
        },
      },
    ]
  }, [note, githubRepo])

  const filteredNoteActions = useMemo(() => {
    return noteActions.filter((item) => {
      return item.label.toLowerCase().includes(deferredQuery.toLowerCase())
    })
  }, [noteActions, deferredQuery])

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
      <div className="card-3 overflow-hidden !rounded-xl">
        <Command.Input
          placeholder="Search or jump to…"
          value={query}
          onValueChange={setQuery}
          autoCapitalize="off"
        />

        <Command.List>
          {filteredNoteActions.length > 0 ? (
            <Command.Group heading="Note actions">
              {filteredNoteActions.map((action) => (
                <CommandItem
                  key={action.label}
                  icon={action.icon}
                  onSelect={handleSelect(action.onSelect)}
                >
                  {action.label}
                </CommandItem>
              ))}
            </Command.Group>
          ) : null}
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
            <Command.Group heading="Pinned notes">
              {pinnedNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  // Since they're all pinned, we don't need to show the pin icon
                  hidePinIcon
                  onSelect={handleSelect(() =>
                    navigate({
                      to: "/notes/$",
                      params: {
                        _splat: note.id,
                      },
                      search: {
                        mode: "read",
                        query: undefined,
                        view: "grid",
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
                      view: "grid",
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
                        view: "grid",
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
                      to: "/tags",
                      search: {
                        query: deferredQuery,
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
                  onSelect={handleSelect(() =>
                    navigate({
                      to: "/notes/$",
                      params: {
                        _splat: note.id,
                      },
                      search: {
                        mode: "read",
                        query: undefined,
                        view: "grid",
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
                        view: "grid",
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
                      view: "grid",
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
          <span className="flex-shrink-0 text-text-secondary">{description}</span>
        ) : null}
        <span className="hidden leading-none text-text-secondary [[aria-selected]_&]:inline eink:[[aria-selected]_&]:text-bg">
          ⏎
        </span>
      </div>
    </Command.Item>
  )
}

function NoteItem({
  note,
  hidePinIcon,
  onSelect,
}: {
  note: Note
  hidePinIcon?: boolean
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
        {!hidePinIcon && note.pinned ? (
          <PinFillIcon12 className="flex-shrink-0 text-text-pinned" />
        ) : null}
        {note?.frontmatter?.gist_id ? (
          <GlobeIcon16 className="flex-shrink-0 text-border-focus" />
        ) : null}
        <span className="truncate">{note.displayName}</span>
      </span>
    </CommandItem>
  )
}
