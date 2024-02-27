import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Button } from "../components/button"
import { Card } from "../components/card"
import { SignedInUser } from "../components/github-auth"
import { LoadingIcon16, SettingsIcon16 } from "../components/icons"
import { Panel } from "../components/panel"
import { RepoForm } from "../components/repo-form"
import { Switch } from "../components/switch"
import { githubRepoAtom, githubUserAtom, globalStateMachineAtom } from "../global-state"
import { getEditorSettings, setEditorSettings } from "../utils/editor-settings"

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
    <Panel icon={<SettingsIcon16 />} title="Settings" className="border-r border-border-secondary">
      <div className="grid gap-4 p-4">
        <h3 className="text-lg font-semibold leading-4">GitHub</h3>
        <SignedInUser />
        {githubUser && githubRepo ? (
          !isEditingRepo ? (
            <Card className="flex items-center justify-between p-4">
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
            </Card>
          ) : (
            <RepoForm
              onSubmit={() => setIsEditingRepo(false)}
              onCancel={() => setIsEditingRepo(false)}
            />
          )
        ) : null}
      </div>
      <div className="grid gap-4 p-4">
        <h3 className="text-lg font-semibold leading-4">Editor</h3>
        <Card className="grid gap-2 p-4">
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
        </Card>
      </div>
    </Panel>
  )
}
