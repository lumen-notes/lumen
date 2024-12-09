import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { useNetworkState } from "react-use"
import { Button } from "../components/button"
import { SignedInUser } from "../components/github-auth"
import { IconButton } from "../components/icon-button"
import {
  ArrowLeftIcon16,
  ArrowRightIcon16,
  LoadingIcon16,
  MenuIcon16,
  PlusIcon16,
} from "../components/icons"
import { RepoForm } from "../components/repo-form"
import { Switch } from "../components/switch"
import { SyncStatusIcon, useSyncStatusText } from "../components/sync-status"
import { githubRepoAtom, githubUserAtom, globalStateMachineAtom } from "../global-state"
import { getEditorSettings, setEditorSettings } from "../hooks/editor-settings"

const isCloningAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloningRepo"),
)

export function SettingsPage() {
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const isCloning = useAtomValue(isCloningAtom)
  const [isEditingRepo, setIsEditingRepo] = React.useState(false)
  const editorSettings = getEditorSettings()

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
        <div className="justify-self-center text-text-secondary">Settings</div>
        <div className="flex items-center justify-self-end">
          <SyncButton />
          <IconButton aria-label="New note" size="small" shortcut={["⌘", "⇧", "O"]}>
            <PlusIcon16 />
          </IconButton>
        </div>
      </header>
      <div className="overflow-auto px-4 [scrollbar-gutter:stable]">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-8 py-4 md:py-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold leading-4">GitHub</h3>
            <div className="flex flex-col gap-4 rounded-lg bg-bg-card p-4 shadow-sm ring-1 ring-border-secondary dark:ring-inset">
              <SignedInUser />
              {githubUser ? (
                <>
                  <div className="h-px w-full bg-border-secondary" />
                  {isEditingRepo || !githubRepo ? (
                    <RepoForm
                      className="gap-5"
                      onSubmit={() => setIsEditingRepo(false)}
                      onCancel={githubRepo ? () => setIsEditingRepo(false) : undefined}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1 coarse:gap-2">
                        <span className="text-sm leading-3 text-text-secondary">Repository</span>
                        {isCloning ? (
                          <span className="inline-flex items-center gap-2 leading-5 text-text-secondary">
                            <LoadingIcon16 />
                            Cloning {githubRepo.owner}/{githubRepo.name}…
                          </span>
                        ) : (
                          <a
                            href={`https://github.com/${githubRepo.owner}/${githubRepo.name}`}
                            className="link link-external leading-5"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {githubRepo.owner}/{githubRepo.name}
                          </a>
                        )}
                      </div>
                      <Button className="flex-shrink-0" onClick={() => setIsEditingRepo(true)}>
                        Change
                      </Button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold leading-4">Editor</h3>
            <div className="flex flex-col gap-2 rounded-lg bg-bg-card p-4 shadow-sm ring-1 ring-border-secondary dark:ring-inset">
              <div className="flex items-center gap-3">
                <Switch
                  id="vim-mode"
                  defaultChecked={editorSettings.vimMode}
                  onCheckedChange={(checked) => setEditorSettings({ vimMode: checked })}
                />
                <label htmlFor="vim-mode">Vim mode</label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="line-numbers"
                  defaultChecked={editorSettings.lineNumbers}
                  onCheckedChange={(checked) => setEditorSettings({ lineNumbers: checked })}
                />
                <label htmlFor="line-numbers">Line numbers</label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="fold-gutter"
                  defaultChecked={editorSettings.foldGutter}
                  onCheckedChange={(checked) => setEditorSettings({ foldGutter: checked })}
                />
                <label htmlFor="fold-gutter">Fold gutter</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
