import { useActor } from "@xstate/react"
import { parseDate } from "chrono-node"
import { Command } from "cmdk"
import { Searcher } from "fast-fuzzy"
import React from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/card"
import { NoteIcon24 } from "../components/icons"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { Panels, PanelsContext } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { formatDate, formatDateDistance } from "../utils/date"
import { pluralize } from "../utils/pluralize"
import { useDebounce } from "../utils/use-debounce"

export function NotesPage() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const noteIds = Object.keys(state.context.notes)

  return (
    <Panels>
      <CommandMenu />
      <Panel title="Notes" icon={<NoteIcon24 />}>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <NoteForm />
          <NoteList ids={noteIds} />
        </div>
      </Panel>
      <Panels.Outlet />
    </Panels>
  )
}

function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const debouncedQuery = useDebounce(query)
  const { panels, openPanel } = React.useContext(PanelsContext)

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
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

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
      onOpenChange={setOpen}
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
              <Command.Item onSelect={() => navigate(`/dates/${dateString}`)}>
                <div className="flex justify-between">
                  <span>{formatDate(dateString)}</span>
                  <span className="text-text-muted">{formatDateDistance(dateString)}</span>
                </div>
              </Command.Item>
            </Command.Group>
          ) : null}
        </Command.List>
      </Card>
    </Command.Dialog>
  )
}
