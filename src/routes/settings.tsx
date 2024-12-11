import { createFileRoute } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { useState } from "react"
import { useNetworkState } from "react-use"
import { AppLayout } from "../components/app-layout"
import { Button } from "../components/button"
import { useSignOut } from "../components/github-auth"
import { GitHubAvatar } from "../components/github-avatar"
import { LoadingIcon16, SettingsIcon16 } from "../components/icons"
import { RepoForm } from "../components/repo-form"
import { Switch } from "../components/switch"
import {
  githubRepoAtom,
  githubUserAtom,
  isCloningRepoAtom,
  isRepoClonedAtom,
  isRepoNotClonedAtom,
} from "../global-state"
import { useEditorSettings } from "../hooks/editor-settings"

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout title="Settings" icon={<SettingsIcon16 />} disableGuard>
      <div className="p-4">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <GitHubSection />
          <EditorSection />
        </div>
      </div>
    </AppLayout>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold leading-4">{title}</h3>
      <div className="card-1 p-4">{children}</div>
    </div>
  )
}

function GitHubSection() {
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const isRepoNotCloned = useAtomValue(isRepoNotClonedAtom)
  const isCloningRepo = useAtomValue(isCloningRepoAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const signOut = useSignOut()
  const { online } = useNetworkState()
  const [isEditingRepo, setIsEditingRepo] = useState(false)

  if (!githubUser) {
    return (
      <SettingsSection title="GitHub">
        {/* TODO */}
        <div className="text-text-secondary">You're not signed in.</div>
      </SettingsSection>
    )
  }

  return (
    <SettingsSection title="GitHub">
      <div className="">
        <div className="flex items-center justify-between gap-4">
          <div className="flex w-0 flex-grow flex-col gap-1">
            <span className="text-sm leading-4 text-text-secondary">Account</span>
            <span className="flex items-center gap-2 leading-4">
              {online ? <GitHubAvatar login={githubUser.login} size={16} /> : null}
              <span className="truncate">{githubUser.login}</span>
            </span>
          </div>
          <Button className="flex-shrink-0" onClick={signOut}>
            Sign out
          </Button>
        </div>
        <div className="mt-4 border-t border-border-secondary pt-4 empty:hidden">
          {isRepoNotCloned || isEditingRepo ? (
            <RepoForm
              onSubmit={() => setIsEditingRepo(false)}
              onCancel={!isRepoNotCloned ? () => setIsEditingRepo(false) : undefined}
            />
          ) : null}
          {isCloningRepo && githubRepo ? (
            <div className="flex items-center gap-2 leading-4 text-text-secondary">
              <LoadingIcon16 />
              Cloning {githubRepo.owner}/{githubRepo.name}…
            </div>
          ) : null}
          {isRepoCloned && !isEditingRepo && githubRepo ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex w-0 flex-grow flex-col items-start gap-1">
                <span className="text-sm leading-4 text-text-secondary">Repository</span>
                <a
                  href={`https://github.com/${githubRepo.owner}/${githubRepo.name}`}
                  className="link link-external leading-5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {githubRepo.owner}/{githubRepo.name}
                </a>
              </div>
              <Button className="flex-shrink-0" onClick={() => setIsEditingRepo(true)}>
                Change
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </SettingsSection>
  )
}

function EditorSection() {
  const [editorSettings, setEditorSettings] = useEditorSettings()
  return (
    <SettingsSection title="Editor">
      <div className="flex flex-col gap-3 leading-4 coarse:gap-4">
        <div className="flex items-center gap-3 coarse:gap-4">
          <Switch
            id="vim-mode"
            defaultChecked={editorSettings.vimMode}
            onCheckedChange={(checked) => setEditorSettings({ vimMode: checked })}
          />
          <label htmlFor="vim-mode">Vim mode</label>
        </div>
        <div className="flex items-center gap-3 coarse:gap-4">
          <Switch
            id="line-numbers"
            defaultChecked={editorSettings.lineNumbers}
            onCheckedChange={(checked) => setEditorSettings({ lineNumbers: checked })}
          />
          <label htmlFor="line-numbers">Line numbers</label>
        </div>
        <div className="flex items-center gap-3 coarse:gap-4">
          <Switch
            id="fold-gutter"
            defaultChecked={editorSettings.foldGutter}
            onCheckedChange={(checked) => setEditorSettings({ foldGutter: checked })}
          />
          <label htmlFor="fold-gutter">Fold gutter</label>
        </div>
      </div>
    </SettingsSection>
  )
}
