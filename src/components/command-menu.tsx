import { useActor } from "@xstate/react"
import { parseDate } from "chrono-node"
import { Command } from "cmdk"
import { Searcher } from "fast-fuzzy"
import qs from "qs"
import React from "react"
import { Card } from "../components/card"
import { PanelsContext } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { formatDate, formatDateDistance } from "../utils/date"
import { pluralize } from "../utils/pluralize"
import { useDebounce } from "../utils/use-debounce"
import { CalendarIcon16, NoteIcon16, PlusIcon16, SearchIcon16, TagIcon16 } from "./icons"

export function CommandMenu() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const [previouslyActiveElement, setPreviouslyActiveElement] = React.useState<Element | null>(null)
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const debouncedQuery = useDebounce(query)
  const { panels, openPanel } = React.useContext(PanelsContext)

  const openMenu = React.useCallback(() => {
    setPreviouslyActiveElement(document.activeElement)
    setOpen(true)
  }, [])

  const closeMenu = React.useCallback(() => {
    setOpen(false)

    // Focus the previously active element
    if (previouslyActiveElement instanceof HTMLElement) {
      setTimeout(() => previouslyActiveElement.focus())
    }
  }, [previouslyActiveElement])

  const navigate = React.useCallback(
    (url: string) => {
      openPanel?.(url, panels.length - 1)
      setOpen(false)
      setQuery("")
    },
    [openPanel, panels, setOpen, setQuery],
  )

  // Toggle the menu with `command + k`
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && event.metaKey) {
        if (open) {
          closeMenu()
        } else {
          openMenu()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, openMenu, closeMenu])

  // Check if query can be parsed as a date
  const dateString = React.useMemo(() => {
    const date = parseDate(debouncedQuery)

    if (!date) return ""

    const year = String(date.getFullYear()).padStart(4, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }, [debouncedQuery])

  // Create tag search index
  const tagSearcher = React.useMemo(() => {
    const entries = Object.entries(state.context.tags)
      .map(([name, noteIds]): [string, number] => [name, noteIds.length])
      // Sort by note count in descending order then alphabetically
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    return new Searcher(entries, {
      keySelector: ([name]) => name,
      threshold: 0.8,
    })
  }, [state.context.tags])

  // Create note search index
  const noteSearcher = React.useMemo(() => {
    // Sort notes by when they were created in descending order
    const entries = Object.entries(state.context.notes).sort(
      (a, b) => parseInt(b[0]) - parseInt(a[0]),
    )
    return new Searcher(entries, {
      keySelector: ([id, body]) => body,
      threshold: 0.8,
    })
  }, [state.context.notes])

  // Search tags
  const tagResults = React.useMemo(() => {
    return tagSearcher.search(debouncedQuery)
  }, [tagSearcher, debouncedQuery])

  // Search notes
  const noteResults = React.useMemo(() => {
    return noteSearcher.search(debouncedQuery)
  }, [noteSearcher, debouncedQuery])

  // Only show the first 2 tags
  const numVisibleTags = 2

  // Only show the first 6 notes
  const numVisibleNotes = 6

  return (
    <Command.Dialog
      label="Global command menu"
      open={open}
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
        <Command.Input placeholder="Search" value={query} onValueChange={setQuery} />
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
              {tagResults.slice(0, numVisibleTags).map(([name, noteCount]) => (
                <CommandItem
                  key={name}
                  icon={<TagIcon16 />}
                  description={pluralize(noteCount, "note")}
                  onSelect={() => navigate(`/tags/${name}`)}
                >
                  #{name}
                </CommandItem>
              ))}
              {tagResults.length > numVisibleTags ? (
                <CommandItem
                  key={`Show all tags matching "${debouncedQuery}"`}
                  icon={<SearchIcon16 />}
                  onSelect={() => navigate(`/tags?${qs.stringify({ q: debouncedQuery })}`)}
                >
                  Show all {pluralize(tagResults.length, "tag")} matching "{debouncedQuery}"
                </CommandItem>
              ) : null}
            </Command.Group>
          ) : null}
          {debouncedQuery ? (
            <Command.Group heading="Notes">
              {noteResults.slice(0, numVisibleNotes).map(([id, body]) => (
                <CommandItem
                  key={id}
                  value={id}
                  icon={<NoteIcon16 />}
                  onSelect={() => navigate(`/${id}`)}
                >
                  {body}
                </CommandItem>
              ))}
              {noteResults.length > numVisibleNotes ? (
                <CommandItem
                  key={`Show all notes matching "${debouncedQuery}"`}
                  icon={<SearchIcon16 />}
                  onSelect={() => navigate(`/?${qs.stringify({ q: debouncedQuery })}`)}
                >
                  Show all {pluralize(noteResults.length, "note")} matching "{debouncedQuery}"
                </CommandItem>
              ) : null}
              <CommandItem
                key={`Create new note "${debouncedQuery}"`}
                icon={<PlusIcon16 />}
                onSelect={() => {
                  const note = {
                    id: Date.now().toString(),
                    body: debouncedQuery,
                  }

                  // Create new note
                  globalState.service.send({
                    type: "UPSERT_NOTE",
                    ...note,
                  })

                  // Navigate to new note
                  navigate(`/${note.id}`)
                }}
              >
                Create new note "{debouncedQuery}"
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
      <div className="grid grid-cols-[28px_1fr_auto]">
        <span>{icon}</span>
        <span className="truncate">{children}</span>
        {description ? <span className="text-text-muted">{description}</span> : null}
      </div>
    </Command.Item>
  )
}
