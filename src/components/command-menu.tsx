import { useActor } from "@xstate/react"
import { parseDate } from "chrono-node"
import { Command } from "cmdk"
import { Searcher } from "fast-fuzzy"
import qs from "qs"
import React from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/card"
import { PanelsContext } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { GraphContext, pathToNodeId } from "../pages/graph"
import { Note } from "../types"
import { formatDate, formatDateDistance } from "../utils/date"
import { pluralize } from "../utils/pluralize"
import { CalendarIcon16, NoteIcon16, PlusIcon16, SearchIcon16, TagIcon16 } from "./icons"

export function CommandMenu() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const prevActiveElement = React.useRef<HTMLElement>()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const deferredQuery = React.useDeferredValue(query)
  const { panels, openPanel } = React.useContext(PanelsContext)
  const { selectNode } = React.useContext(GraphContext)
  const routerNavigate = useNavigate()
  const [noteSearcher, setNoteSearcher] = React.useState<Searcher<
    [string, Note],
    Record<string, unknown>
  > | null>(null)

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
      if (selectNode && pathToNodeId(url)) {
        // If we're in a graph context, navigate by selecting the node in the graph
        selectNode(pathToNodeId(url), { centerInView: true })
      } else if (openPanel) {
        // If we're in a panels context, navigate by opening a panel
        openPanel(url, panels.length - 1)
      } else {
        // Otherwise, navigate by using the router
        routerNavigate(url)
      }

      setIsOpen(false)
      setQuery("")
    },
    [selectNode, openPanel, panels, routerNavigate],
  )

  // Toggle the menu with `command + k`
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
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
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, openMenu, closeMenu])

  // Check if query can be parsed as a date
  const dateString = React.useMemo(() => {
    const date = parseDate(deferredQuery)

    if (!date) return ""

    const year = String(date.getFullYear()).padStart(4, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }, [deferredQuery])

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
  // We use useEffect here to avoid blocking the first render while sorting the notes
  React.useEffect(() => {
    // Sort notes by when they were created in descending order
    const entries = Object.entries(state.context.notes).sort(
      (a, b) => parseInt(b[0]) - parseInt(a[0]),
    )

    const noteSearcher = new Searcher(entries, {
      keySelector: ([id, { body }]) => body,
      threshold: 0.8,
    })

    React.startTransition(() => {
      setNoteSearcher(noteSearcher)
    })
  }, [state.context.notes])

  // Search tags
  const tagResults = React.useMemo(() => {
    return tagSearcher.search(deferredQuery)
  }, [tagSearcher, deferredQuery])

  // Search notes
  const noteResults = React.useMemo(() => {
    return noteSearcher?.search(deferredQuery) ?? []
  }, [noteSearcher, deferredQuery])

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
        <Command.Input placeholder="Search or jump to..." value={query} onValueChange={setQuery} />
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
              {noteResults.slice(0, numVisibleNotes).map(([id, { body }]) => (
                <CommandItem
                  key={id}
                  value={id}
                  icon={<NoteIcon16 />}
                  onSelect={() => navigate(`/${id}`)}
                >
                  {body}
                </CommandItem>
              ))}
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
                    body: deferredQuery,
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
