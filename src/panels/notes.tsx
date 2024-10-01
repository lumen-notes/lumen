import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { Card } from "../components/card"
import { SignInButton } from "../components/github-auth"
import { LoadingIcon16, NoteIcon16 } from "../components/icons"
import { LumenLogo } from "../components/lumen-logo"
import { Markdown } from "../components/markdown"
import { NoteCard } from "../components/note-card"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { RepoForm } from "../components/repo-form"
import {
  githubRepoAtom,
  globalStateMachineAtom,
  isRepoClonedAtom,
  notesAtom,
} from "../global-state"

const isEmptyAtom = selectAtom(globalStateMachineAtom, (state) => state.matches("signedIn.empty"))

const isCloningRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloningRepo"),
)

const isSignedOutAtom = selectAtom(globalStateMachineAtom, (state) => state.matches("signedOut"))

const hasNotesAtom = selectAtom(notesAtom, (notes) => notes.size > 0)

const welcomeMessage = `# Welcome to Lumen

Lumen is a simple note-taking app for capturing and organizing your thoughts.

- Write notes in markdown files and store them in a GitHub repository of your choice. You stay in control of your data.
- Connect your notes with links and tags. Lumen makes it easy to explore  your knowledge graph and discover new connections.
- Access your notes from any device, even offline. Use Lumen's powerful search to find exactly what you're looking for.

Lumen is free and [open-source](https://github.com/lumen-notes/lumen).`

export function NotesPanel({ id, onClose }: PanelProps) {
  const isEmpty = useAtomValue(isEmptyAtom)
  const isCloningRepo = useAtomValue(isCloningRepoAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const hasNotes = useAtomValue(hasNotesAtom)
  const isSignedOut = useAtomValue(isSignedOutAtom)

  return (
    <Panel id={id} title="Notes" icon={<NoteIcon16 />} onClose={onClose}>
      <div className="p-4">
        {isEmpty ? (
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
        ) : isSignedOut ? (
          <Card className="flex flex-col items-start gap-5 p-4">
            <LumenLogo size={20} />
            <Markdown>{welcomeMessage}</Markdown>
            <SignInButton />
          </Card>
        ) : isRepoCloned && !hasNotes ? (
          <NoteCard id={`${Date.now()}`} placeholder="Write your first note…" />
        ) : isRepoCloned && hasNotes ? (
          <div className="flex flex-col gap-4">
            <NoteList />
          </div>
        ) : null}
      </div>
    </Panel>
  )
}
