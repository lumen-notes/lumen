import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { LoadingIcon16, NoteIcon16 } from "../components/icons"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps } from "../components/panels"
import { globalStateMachineAtom } from "../global-state"
import { RepoForm } from "../components/repo-form"

export function NotesPanel({ id, onClose }: PanelProps) {
  const state = useAtomValue(globalStateMachineAtom)
  const noteCountAtom = React.useMemo(
    () =>
      selectAtom(
        globalStateMachineAtom,
        (state) => Object.keys(state.context.markdownFiles).length,
      ),
    [],
  )
  const noteCount = useAtomValue(noteCountAtom)

  return (
    <Panel id={id} title="Notes" icon={<NoteIcon16 />} onClose={onClose}>
      <div className="p-4">
        {state.matches("signedIn.empty") ? (
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

        {state.matches("signedIn.cloningRepo") ? (
          <span className="inline-flex items-center gap-2 leading-4 text-text-secondary">
            <LoadingIcon16 />
            Cloning {state.context.githubRepo?.owner}/{state.context.githubRepo?.name}…
          </span>
        ) : null}

        {state.matches("signedIn.cloned") ? (
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
