import { parseDate } from "chrono-node"
import { Command } from "cmdk"
import React from "react"
import { Card } from "../components/card"
import { PanelsContext } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { formatDate, formatDateDistance } from "../utils/date"
import { useDebounce } from "../utils/use-debounce"
import { CalendarIcon16, PlusIcon16, SearchIcon16 } from "./icons"

export function CommandMenu() {
  const globalState = React.useContext(GlobalStateContext)
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

  const dateString = React.useMemo(() => {
    const date = parseDate(debouncedQuery)

    if (!date) return ""

    const year = String(date.getFullYear()).padStart(4, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }, [debouncedQuery])

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
          {debouncedQuery ? (
            <Command.Group heading="Notes">
              <CommandItem
                key={`Show all notes matching "${debouncedQuery}"`}
                icon={<SearchIcon16 />}
                onSelect={() => {
                  // TODO
                }}
              >
                Show all notes matching "{debouncedQuery}"
              </CommandItem>
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
  icon?: React.ReactNode
  description?: string
  onSelect?: () => void
}

function CommandItem({ children, icon, description, onSelect }: CommandItemProps) {
  return (
    <Command.Item onSelect={onSelect}>
      <div className="flex justify-between">
        <div className="flex gap-2">
          {icon}
          <span>{children}</span>
        </div>
        {description ? <span className="text-text-muted">{description}</span> : null}
      </div>
    </Command.Item>
  )
}
