import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { LoadingIcon16, NoteIcon16 } from "../components/icons"
import { NoteCard } from "../components/note-card"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { RepoForm } from "../components/repo-form"
import { githubRepoAtom, globalStateMachineAtom, isSignedOutAtom, notesAtom } from "../global-state"

const isRepoNotClonedAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.notCloned"),
)

const isCloningRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloningRepo"),
)

const isRepoClonedAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned"),
)

const hasNotesAtom = selectAtom(notesAtom, (notes) => notes.size > 0)

export function NotesPanel({ id, onClose }: PanelProps) {
  const isRepoNotCloned = useAtomValue(isRepoNotClonedAtom)
  const isCloningRepo = useAtomValue(isCloningRepoAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const hasNotes = useAtomValue(hasNotesAtom)

  return (
    <Panel id={id} title="Notes" icon={<NoteIcon16 />} onClose={onClose}>
      <div className="p-4">
        {isRepoNotCloned ? (
          <div className="flex w-full flex-col gap-4">
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
          !hasNotes ? (
            <NoteCard id={`${Date.now()}`} placeholder="Write your first note…" />
          ) : (
            <NoteList />
          )
        ) : null}
      </div>
    </Panel>
  )
}
