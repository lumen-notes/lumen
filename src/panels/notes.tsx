import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { SignInButton } from "../components/github-auth"
import { NoteIcon24 } from "../components/icons"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { githubRepoAtom, githubTokenAtom, rawNotesAtom } from "../global-atoms"

export function NotesPanel({ id, onClose }: PanelProps) {
  const githubToken = useAtomValue(githubTokenAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const noteCountAtom = React.useMemo(
    () => selectAtom(rawNotesAtom, (rawNotes) => Object.keys(rawNotes).length),
    [],
  )
  const noteCount = useAtomValue(noteCountAtom)

  return (
    <Panel id={id} title="Notes" icon={<NoteIcon24 />} onClose={onClose}>
      <div className="p-4">
        {!githubToken || !githubRepo?.owner || !githubRepo?.name ? (
          // If GitHub repository hasn't been configured
          <div>
            <SignInButton />
          </div>
        ) : noteCount === 0 ? (
          // If GitHub repository has been configured but no notes exist
          <NoteCardForm placeholder="Write your first note…" minHeight="12rem" />
        ) : (
          <NoteList />
        )}
      </div>
    </Panel>
  )
}
