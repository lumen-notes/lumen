import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { useNetworkState } from "react-use"
import { IconButton } from "../components/icon-button"
import { ArrowLeftIcon16, ArrowRightIcon16, PlusIcon16, SidebarIcon16 } from "../components/icons"
import { NoteList } from "../components/note-list"
import { SyncStatusIcon, useSyncStatusText } from "../components/sync-status"
import { globalStateMachineAtom } from "../global-state"

export function NotesPage() {
  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden">
      <header className="grid h-10 grid-cols-3 items-center border-b border-border-secondary px-2">
        <div className="flex items-center">
          <IconButton aria-label="Menu" size="small" disableTooltip>
            <SidebarIcon16 />
          </IconButton>
          <IconButton aria-label="Go back" size="small" shortcut={["⌘", "["]} className="group">
            <ArrowLeftIcon16 className="transition-transform duration-100 group-active:-translate-x-0.5" />
          </IconButton>
          <IconButton aria-label="Go forward" size="small" shortcut={["⌘", "]"]} className="group">
            <ArrowRightIcon16 className="transition-transform duration-100 group-active:translate-x-0.5" />
          </IconButton>
        </div>
        <div className="justify-self-center">Notes</div>
        <div className="flex items-center justify-self-end">
          <SyncButton />
          <IconButton aria-label="New note" size="small" shortcut={["⌘", "⇧", "O"]}>
            <PlusIcon16 />
          </IconButton>
        </div>
      </header>
      <div className="overflow-auto p-4">
        <NoteList />
      </div>
    </div>
  )
  // return (
  //   <Panels.Container>
  //     <NotesPanel />
  //     <Panels.Outlet />
  //   </Panels.Container>
  // )
}

const isClonedAtom = selectAtom(globalStateMachineAtom, (state) => state.matches("signedIn.cloned"))

function SyncButton() {
  const isCloned = useAtomValue(isClonedAtom)
  const send = useSetAtom(globalStateMachineAtom)
  const syncStatusText = useSyncStatusText()
  const { online } = useNetworkState()

  if (!isCloned) return null

  return (
    <IconButton
      aria-label={syncStatusText}
      size="small"
      disabled={!online}
      onClick={() => send({ type: "SYNC" })}
    >
      <SyncStatusIcon size={16} />
    </IconButton>
  )
}
