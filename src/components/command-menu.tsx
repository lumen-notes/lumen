import { parseDate } from "chrono-node"
import { Command } from "cmdk"
import { useAtomValue, useSetAtom } from "jotai"
import qs from "qs"
import React from "react"
import { useNavigate } from "react-router-dom"
import { useEvent } from "react-use"
import { Card } from "../components/card"
import { PanelsContext } from "../components/panels"
import { tagSearcherAtom, upsertNoteAtom } from "../global-atoms"
import { formatDate, formatDateDistance } from "../utils/date"
import { pluralize } from "../utils/pluralize"
import { useSearchNotes } from "../utils/use-search-notes"
import { CalendarIcon16, NoteIcon16, PlusIcon16, SearchIcon16, TagIcon16 } from "./icons"

export function CommandMenu() {
  const searchNotes = useSearchNotes()
  const tagSearcher = useAtomValue(tagSearcherAtom)
  const upsertNote = useSetAtom(upsertNoteAtom)

  const { panels, openPanel } = React.useContext(PanelsContext)
  const routerNavigate = useNavigate()

  const prevActiveElement = React.useRef<HTMLElement>()

  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const deferredQuery = React.useDeferredValue(query)

  const openMenu = React.useCallback(() => {
    prevActiveElement.current = document.activeElement as HTMLElement
    setIsOpen(true)
  }, [])

  const closeMenu = React.useCallback(() => {
    setIsOpen(false)

    // Focus the previously active element
    setTimeout(() => prevActiveElement.current?.focus())
  }, [])

  const navigate = React.useCallback(
    (url: string) => {
      if (openPanel) {
        // If we're in a panels context, navigate by opening a panel
        openPanel(url, panels.length - 1)
      } else {
        // Otherwise, navigate using the router
        routerNavigate(url)
      }

      setIsOpen(false)
      setQuery("")
    },
    [openPanel, panels, routerNavigate],
  )

  // Toggle the menu with `command + k`
  useEvent("keydown", (event: KeyboardEvent) => {
    if (event.key === "k" && event.metaKey) {
      if (isOpen) {
        closeMenu()
      } else {
        const textSelection = window.getSelection()?.toString()

        // If text is selected, use that as the initial query
        if (textSelection) {
          setQuery(textSelection)
        }

        openMenu()
      }
    }
  })

  // Check if query can be parsed as a date
  const dateString = React.useMemo(() => {
    const date = parseDate(deferredQuery)

    if (!date) return ""

    const year = String(date.getFullYear()).padStart(4, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }, [deferredQuery])

  // Search tags
  const tagResults = React.useMemo(() => {
    return tagSearcher.search(deferredQuery)
  }, [tagSearcher, deferredQuery])

  // Search notes
  const noteResults = React.useMemo(() => {
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
      onOpenChange={(open) => (open ? openMenu() : closeMenu())}
      shouldFilter={false}
      onKeyDown={(event) => {
        // Clear input with `esc`
        if (event.key === "Escape" && query) {
          setQuery("")
          event.preventDefault()
        }
      }}
    >
      <Card elevation={2}>
        <Command.Input placeholder="Search or jump to…" value={query} onValueChange={setQuery} />
        <Command.List>
          {dateString ? (
            <Command.Group heading="Date">
              <CommandItem
                key={dateString}
                icon={<CalendarIcon16 />}
                description={formatDateDistance(dateString)}
                onSelect={() => navigate(`/dates/${dateString}`)}
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
                  onSelect={() => navigate(`/tags/${name}`)}
                >
                  {name}
                </CommandItem>
              ))}
              {tagResults.length > numVisibleTags ? (
                <CommandItem
                  key={`Show all tags matching "${deferredQuery}"`}
                  icon={<SearchIcon16 />}
                  onSelect={() => navigate(`/tags?${qs.stringify({ q: deferredQuery })}`)}
                >
                  Show all {pluralize(tagResults.length, "tag")} matching "{deferredQuery}"
                </CommandItem>
              ) : null}
            </Command.Group>
          ) : null}
          {deferredQuery ? (
            <Command.Group heading="Notes">
              {noteResults.slice(0, numVisibleNotes).map(([id, note]) => {
                return (
                  <CommandItem
                    key={id}
                    value={id}
                    icon={<NoteIcon16 />}
                    onSelect={() => navigate(`/${id}`)}
                  >
                    <span className="inline-flex gap-2">
                      <span>{note.title || id}</span>
                      <span className="text-text-secondary">
                        {note.tags.map((tag) => `#${tag}`).join(" ")}
                      </span>
                    </span>
                  </CommandItem>
                )
              })}
              {noteResults.length > 0 ? (
                <CommandItem
                  key={`Show all notes matching "${deferredQuery}"`}
                  icon={<SearchIcon16 />}
                  onSelect={() => navigate(`/?${qs.stringify({ q: deferredQuery })}`)}
                >
                  Show all {pluralize(noteResults.length, "note")} matching "{deferredQuery}"
                </CommandItem>
              ) : null}
              <CommandItem
                key={`Create new note "${deferredQuery}"`}
                icon={<PlusIcon16 />}
                onSelect={() => {
                  const note = {
                    id: Date.now().toString(),
                    rawBody: deferredQuery,
                  }

                  // Create new note
                  upsertNote(note)

                  // Navigate to new note
                  navigate(`/${note.id}`)
                }}
              >
                Create new note "{deferredQuery}"
              </CommandItem>
            </Command.Group>
          ) : null}
        </Command.List>
      </Card>
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
      <div className="grid grid-cols-[1.75rem_1fr_auto]">
        <span className="text-text-secondary">{icon}</span>
        <span className="truncate">{children}</span>
        {description ? <span className="text-text-secondary">{description}</span> : null}
      </div>
    </Command.Item>
  )
}
