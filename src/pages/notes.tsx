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
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const debouncedValue = useDebounce(value)
  const { panels, openPanel } = React.useContext(PanelsContext)

  function openMenu() {
    setOpen(true)
  }

  function closeMenu() {
    setOpen(false)
    setValue("")
  }

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
  }, [])

  const dateString = React.useMemo(() => {
    const date = parseDate(debouncedValue)

    if (!date) return ""

    const year = String(date.getFullYear()).padStart(4, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }, [debouncedValue])

  return (
    <Command.Dialog
      label="Global command menu"
      open={open}
      onOpenChange={(open) => (open ? openMenu() : closeMenu())}
      shouldFilter={false}
    >
      <Card elevation={2}>
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
        </Command.List>
      </Card>
    </Command.Dialog>
  )
}
