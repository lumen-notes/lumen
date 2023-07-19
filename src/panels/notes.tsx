import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Link } from "react-router-dom"
import { NoteIcon24 } from "../components/icons"
import { LinkContext } from "../components/link-context"
import { Markdown } from "../components/markdown"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { githubRepoAtom, githubTokenAtom, rawNotesAtom } from "../global-atoms"

// Copied from the "Getting started" section of the README
const welcomeMessage = `
# Welcome to Lumen 👋

Lumen is a note-taking app for lifelong learners, based on the [Zettelkasten Method](https://zettelkasten.de/introduction/).

---

## Getting started

1. Create a new GitHub repository for your notes using the [notes template repository](https://github.com/lumen-notes/lumen-template) OR copy [\`.github/workflows/lumen.yml\`](https://github.com/lumen-notes/notes-template/blob/main/.github/workflows/lumen.yml) into an existing repository.
1. Generate a GitHub [personal access token](https://github.com/settings/personal-access-tokens/new) with [read and write permissions for your repository contents](https://github.com/lumen-notes/lumen/assets/4608155/73cbee0b-eb3b-4934-b374-d972dcf7f231).
1. Paste your personal access token and repository details into Lumen's [settings page](/settings).
1. Write your first note in Lumen!
1. Optional: [Install Lumen as an app](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing).
`

const warningMessage = `
⚠️ **Warning:** Work in progress. Expect breaking changes. Follow me on [Twitter](https://twitter.com/colebemis) for status updates.
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
          <div>
            <LinkContext.Provider value={Link}>
              <Markdown>{welcomeMessage.trim()}</Markdown>
              <div className="mt-5 rounded-sm bg-bg-secondary px-3 py-2">
                <Markdown>{warningMessage.trim()}</Markdown>
              </div>
            </LinkContext.Provider>
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
