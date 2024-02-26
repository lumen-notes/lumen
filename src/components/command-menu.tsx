import { parseDate } from "chrono-node"
import { Command } from "cmdk"
import { useAtomValue } from "jotai"
import qs from "qs"
import React from "react"
import { flushSync } from "react-dom"
import { useEvent } from "react-use"
import { Card } from "../components/card"
import { usePanelActions, usePanels } from "../components/panels"
import { tagSearcherAtom } from "../global-state"
import { useDebouncedValue } from "../hooks/debounced-value"
import { useNavigateWithCache } from "../hooks/navigate-with-cache"
import { useSaveNote } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { templateSchema } from "../schema"
import { formatDate, formatDateDistance, toDateString } from "../utils/date"
import { pluralize } from "../utils/pluralize"
import { removeParentTags } from "../utils/remove-parent-tags"
import {
  CalendarIcon16,
  NoteIcon16,
  PlusIcon16,
  SearchIcon16,
  SettingsIcon16,
  TagIcon16,
} from "./icons"
import { NoteFavicon } from "./note-favicon"

export function CommandMenu() {
  const searchNotes = useSearchNotes()
  const tagSearcher = useAtomValue(tagSearcherAtom)
  const saveNote = useSaveNote()
  const panels = usePanels()
  const { openPanel } = usePanelActions()
  const routerNavigate = useNavigateWithCache()

  // Refs
  const prevActiveElement = React.useRef<HTMLElement>()

  // Local state
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [debouncedQuery] = useDebouncedValue(query, 200, { leading: true })

  const openMenu = React.useCallback(() => {
    prevActiveElement.current = document.activeElement as HTMLElement
    setIsOpen(true)
  }, [])

  const closeMenu = React.useCallback(() => {
    flushSync(() => {
      setIsOpen(false)
    })

    // Focus the previously active element
    prevActiveElement.current?.focus()
  }, [])

  const navigate = React.useCallback(
    (url: string, { openInPanel = true }: { openInPanel?: boolean } = {}) => {
      if (openInPanel && openPanel) {
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
    if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
      if (isOpen) {
        closeMenu()
      } else {
        const textSelection = window.getSelection()?.toString()

        // If text is selected, use that as the initial query
        if (textSelection) {
          setQuery(textSelection)
        }

        openMenu()
        event.preventDefault()
      }
    }
  })

  // Check if query can be parsed as a date
  const dateString = React.useMemo(() => {
    const date = parseDate(debouncedQuery)

    if (!date) return ""

    const year = String(date.getFullYear()).padStart(4, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }, [debouncedQuery])

  // Search tags
  const tagResults = React.useMemo(() => {
    return tagSearcher.search(debouncedQuery)
  }, [tagSearcher, debouncedQuery])

  // Search notes
  const noteResults = React.useMemo(() => {
    return searchNotes(debouncedQuery)
  }, [searchNotes, debouncedQuery])

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
      <Card elevation={3}>
        <Command.Input placeholder="Search or jump to…" value={query} onValueChange={setQuery} />
        <Command.List>
          {dateString ? (
            <Command.Group heading="Date">
              <CommandItem
                key={dateString}
                icon={<CalendarIcon16 number={new Date(dateString).getUTCDate()} />}
                description={formatDateDistance(dateString)}
                onSelect={() => navigate(`/${dateString}`)}
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
              {noteResults.slice(0, numVisibleNotes).map((note) => {
                const parsedTemplate = templateSchema
                  .omit({ body: true })
                  .safeParse(note.frontmatter.template)
                return (
                  <CommandItem
                    key={note.id}
                    value={note.id}
                    icon={<NoteFavicon note={note} />}
                    onSelect={() => navigate(`/${note.id}`)}
                  >
                    <span className="inline-flex gap-2">
                      {parsedTemplate.success ? (
                        <span>{parsedTemplate.data.name} template</span>
                      ) : (
                        <span>{note.title || note.id}</span>
                      )}
                      <span className="text-text-secondary">
                        {removeParentTags(note.tags)
                          .map((tag) => `#${tag}`)
                          .join(" ")}
                      </span>
                    </span>
                  </CommandItem>
                )
              })}
              {noteResults.length > 0 ? (
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
                    content: debouncedQuery,
                  }

                  // Create new note
                  saveNote(note)

                  // Navigate to new note
                  navigate(`/${note.id}`)
                }}
              >
                Create new note "{debouncedQuery}"
              </CommandItem>
            </Command.Group>
          ) : (
            <Command.Group heading="Jump to">
              <CommandItem
                key="Notes"
                icon={<NoteIcon16 />}
                onSelect={() => navigate(`/`, { openInPanel: false })}
              >
                Notes
              </CommandItem>
              <CommandItem
                key="Today"
                icon={<CalendarIcon16 number={new Date().getDate()} />}
                onSelect={() => navigate(`/${toDateString(new Date())}`, { openInPanel: false })}
              >
                Today
              </CommandItem>
              <CommandItem
                key="Tags"
                icon={<TagIcon16 />}
                onSelect={() => navigate(`/tags`, { openInPanel: false })}
              >
                Tags
              </CommandItem>
              <CommandItem
                key={"Settings"}
                icon={<SettingsIcon16 />}
                onSelect={() => navigate("/settings", { openInPanel: false })}
              >
                Settings
              </CommandItem>
            </Command.Group>
          )}
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
