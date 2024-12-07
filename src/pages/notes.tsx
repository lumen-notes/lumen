import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { useNetworkState } from "react-use"
import { IconButton } from "../components/icon-button"
import {
  ArrowLeftIcon16,
  ArrowRightIcon16,
  LoadingIcon16,
  MenuIcon16,
  PlusIcon16,
} from "../components/icons"
import { NoteList } from "../components/note-list"
import { RepoForm } from "../components/repo-form"
import { SyncStatusIcon, useSyncStatusText } from "../components/sync-status"
import { githubRepoAtom, globalStateMachineAtom, isSignedOutAtom } from "../global-state"

const isRepoNotClonedAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.notCloned"),
)

const isCloningRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloningRepo"),
)

const isRepoClonedAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned"),
)

export function NotesPage() {
  const githubRepo = useAtomValue(githubRepoAtom)
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const isRepoNotCloned = useAtomValue(isRepoNotClonedAtom)
  const isCloningRepo = useAtomValue(isCloningRepoAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden">
      <header className=" grid h-10 grid-cols-3 items-center  px-2">
        <div className="flex items-center">
          <IconButton aria-label="Menu" size="small" disableTooltip>
            <MenuIcon16 />
          </IconButton>
          <IconButton aria-label="Go back" size="small" shortcut={["⌘", "["]} className="group">
            <ArrowLeftIcon16 className="transition-transform duration-100 group-active:-translate-x-0.5" />
          </IconButton>
          <IconButton aria-label="Go forward" size="small" shortcut={["⌘", "]"]} className="group">
            <ArrowRightIcon16 className="transition-transform duration-100 group-active:translate-x-0.5" />
          </IconButton>
        </div>
        <div className="justify-self-center text-text-secondary">Notes</div>
        <div className="flex items-center justify-self-end">
          <SyncButton />
          <IconButton aria-label="New note" size="small" shortcut={["⌘", "⇧", "O"]}>
            <PlusIcon16 />
          </IconButton>
        </div>
      </header>
      <div className="overflow-auto p-4 [scrollbar-gutter:stable]">
        {isRepoNotCloned ? (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-6 md:py-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold">Choose a repository</h1>
              <p className="text-text-secondary">
                Store your notes as markdown files in a GitHub repository of your choice.
              </p>
            </div>
            <RepoForm />
          </div>
        ) : isCloningRepo ? (
          <span className="inline-flex items-center gap-2 leading-4 text-text-secondary">
            <LoadingIcon16 />
            Cloning {githubRepo?.owner}/{githubRepo?.name}…
          </span>
        ) : isRepoCloned || isSignedOut ? (
          <NoteList initialVisibleNotes={25} />
        ) : null}
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
