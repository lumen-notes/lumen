import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { LoadingIcon16, NoteIcon16 } from "../components/icons"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { RepoForm } from "../components/repo-form"
import { githubRepoAtom, globalStateMachineAtom } from "../global-state"

const isEmptyAtom = selectAtom(globalStateMachineAtom, (state) => state.matches("signedIn.empty"))

const isCloningRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloningRepo"),
)

const isClonedAtom = selectAtom(globalStateMachineAtom, (state) => state.matches("signedIn.cloned"))

const noteCountAtom = selectAtom(
  globalStateMachineAtom,
  (state) => Object.keys(state.context.markdownFiles).length,
)

export function NotesPanel({ id, onClose }: PanelProps) {
  const isEmpty = useAtomValue(isEmptyAtom)
  const isCloningRepo = useAtomValue(isCloningRepoAtom)
  const isCloned = useAtomValue(isClonedAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const noteCount = useAtomValue(noteCountAtom)

  return (
    <Panel id={id} title="Notes" icon={<NoteIcon16 />} onClose={onClose}>
      <div className="p-4">
        {isEmpty ? (
          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold">Choose a repository</h1>
              <p className="text-text-secondary">
                Store your notes as markdown files in a GitHub repository of your choice.
              </p>
            </div>
            <RepoForm />
          </div>
        ) : null}

        {isCloningRepo ? (
          <span className="inline-flex items-center gap-2 leading-4 text-text-secondary">
            <LoadingIcon16 />
            Cloning {githubRepo?.owner}/{githubRepo?.name}…
          </span>
        ) : null}

        {isCloned ? (
          noteCount === 0 ? (
            <NoteCardForm placeholder="Write your first note…" minHeight="12rem" />
          ) : (
            <NoteList />
          )
        ) : null}
      </div>
    </Panel>
  )
}
