import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { NoteIcon24 } from "../components/icons"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { githubRepoAtom, githubTokenAtom, rawNotesAtom } from "../global-atoms"
import { NoteCardForm } from "../components/note-card-form"
import { Markdown } from "../components/markdown"
import { Card } from "../components/card"
import { Link } from "react-router-dom"
import { LinkContext } from "../components/link-context"

const welcomeMessage = `
# Welcome to Lumen

Follow these steps to get started:

1. Create a GitHub repository for your notes using the [notes template repository](https://github.com/lumen-notes/lumen-template).
1. Generate a new GitHub [personal access token](https://github.com/settings/personal-access-tokens/new) with [read and write permissions for your repository contents](https://github.com/lumen-notes/lumen/assets/4608155/73cbee0b-eb3b-4934-b374-d972dcf7f231).
1. Paste your personal access token and repository details into the [settings page](/settings).
1. Start writing [markdown](https://lumen-notes.github.io/lumen/markdown-syntax) notes in Lumen!

> **Warning**: Lumen is experimental. Expect frequent breaking changes. See the [project board](https://github.com/orgs/lumen-notes/projects/2) for progress updates.
`

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
          <Card className="p-4">
            <LinkContext.Provider value={Link}>
              <Markdown>{welcomeMessage.trim()}</Markdown>
            </LinkContext.Provider>
          </Card>
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
