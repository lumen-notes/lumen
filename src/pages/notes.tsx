import { useActor } from "@xstate/react"
import React from "react"
import { NoteIcon24 } from "../components/icons"
import { NoteForm } from "../components/note-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { Panels, PanelsContext } from "../components/panels"
import { GlobalStateContext } from "../global-state"
import { pluralize } from "../utils/pluralize"
import { Command } from "cmdk"
import { parseDate } from "chrono-node"
import { formatDate, formatDateDistance } from "../utils/date"
import { useNavigate } from "react-router-dom"
import { useDebounce } from "../utils/use-debounce"
import { Searcher } from "fast-fuzzy"

export function NotesPage() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const noteIds = Object.keys(state.context.notes)

  return (
    <Panels>
      <CommandMenu />
      <Panel title="Notes" description={pluralize(noteIds.length, "note")} icon={<NoteIcon24 />}>
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
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const debouncedValue = useDebounce(value)
  const navigate = useNavigate()
  const { panels, openPanel } = React.useContext(PanelsContext)

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
    const date = parseDate(debouncedValue)

    if (!date) return ""

    const year = String(date.getFullYear()).padStart(4, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }, [debouncedValue])

  // Sort tags alphabetically
  const sortedTags = React.useMemo(
    () => Object.entries(state.context.tags).sort((a, b) => a[0].localeCompare(b[0])),
    [state.context.tags],
  )

  // Create a search index
  const searcher = React.useMemo(() => {
    return new Searcher(sortedTags, {
      keySelector: ([name]) => name,
      threshold: 0.8,
    })
  }, [sortedTags])

  const tagResults = React.useMemo(() => {
    return searcher.search(debouncedValue)
  }, [debouncedValue, sortedTags, searcher])

  return (
    <Command.Dialog
      label="Global command menu"
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        setValue("")
      }}
      shouldFilter={false}
    >
      <Command.Input value={value} onValueChange={setValue} />
      <Command.List>
        {dateString ? (
          <Command.Group heading="Date">
            <Command.Item
              onSelect={() => {
                openPanel?.(`/dates/${dateString}`, panels.length - 1)
                setOpen(false)
              }}
            >
              <div className="flex justify-between">
                <span>{formatDate(dateString)}</span>

                <span className="text-text-muted">{formatDateDistance(dateString)}</span>
              </div>
            </Command.Item>
          </Command.Group>
        ) : null}
        {tagResults.length > 0 ? (
          <Command.Group heading="Tags">
            {tagResults.map(([name, noteIds]) => (
              <Command.Item
                onSelect={() => {
                  openPanel?.(`/tags/${name}`, panels.length - 1)
                  setOpen(false)
                }}
              >
                {name}
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
      </Command.List>
    </Command.Dialog>
  )
}
