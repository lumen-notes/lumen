import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { SignInButton } from "../components/github-auth"
import { NoteIcon24 } from "../components/icons"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { githubRepoAtom, githubUserAtom, rawNotesAtom } from "../global-atoms"
import { RepositoryPicker } from "../components/repository-picker"

export function NotesPanel({ id, onClose }: PanelProps) {
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const noteCountAtom = React.useMemo(
    () => selectAtom(rawNotesAtom, (rawNotes) => Object.keys(rawNotes).length),
    [],
  )
  const noteCount = useAtomValue(noteCountAtom)

  return (
    <Panel id={id} title="Notes" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="p-4">
        {!githubUser ? (
          <SignInButton />
        ) : !githubRepo ? (
          <RepositoryPicker />
        ) : noteCount === 0 ? (
          <NoteCardForm placeholder="Write your first note…" minHeight="12rem" />
        ) : (
          <NoteList />
        )}
      </div>
    </Panel>
  )
}
