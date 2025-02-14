import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useAtom, useAtomValue } from "jotai"
import { useState } from "react"
import { useNetworkState } from "react-use"
import { AppLayout } from "../components/app-layout"
import { Button } from "../components/button"
import { useSignOut } from "../components/github-auth"
import { GitHubAvatar } from "../components/github-avatar"
import { LoadingIcon16, SettingsIcon16 } from "../components/icons"
import { OpenAIKeyInput } from "../components/openai-key-input"
import { RadioGroup } from "../components/radio-group"
import { RepoForm } from "../components/repo-form"
import { Switch } from "../components/switch"
import {
  fontAtom,
  githubRepoAtom,
  githubUserAtom,
  hasOpenAIKeyAtom,
  isCloningRepoAtom,
  isRepoClonedAtom,
  isRepoNotClonedAtom,
  themeAtom,
  voiceConversationsEnabledAtom,
} from "../global-state"
import { useEditorSettings } from "../hooks/editor-settings"
import { cx } from "../utils/cx"

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout title="Settings" icon={<SettingsIcon16 />} disableGuard>
      <div className="p-4 pb-8 md:pb-14">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <GitHubSection />
          <ThemeSection />
          <FontSection />
          <EditorSection />
          <AISection />
        </div>
      </div>
    </AppLayout>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-content text-lg font-bold leading-4">{title}</h3>
      <div className="card-1 p-4">{children}</div>
    </div>
  )
}

function GitHubSection() {
  const navigate = useNavigate()
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex w-0 flex-grow flex-col gap-1">
          <span className="text-sm leading-4 text-text-secondary">Account</span>
          <span className="flex items-center gap-2 leading-4">
            {online ? <GitHubAvatar login={githubUser.login} /> : null}
            <span className="truncate">{githubUser.login}</span>
          </span>
        </div>
        <Button
          className="flex-shrink-0"
          onClick={() => {
            signOut()
            navigate({ to: "/", search: { query: undefined, view: "grid" } })
          }}
        >
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
    </SettingsSection>
  )
}

function ThemeSection() {
  const [theme, setTheme] = useAtom(themeAtom)

  return (
    <SettingsSection title="Theme">
      <RadioGroup
        aria-labelledby="theme-label"
        value={theme}
        defaultValue="default"
        onValueChange={(value) => setTheme(value as "default" | "eink")}
        className="flex flex-col gap-3 coarse:gap-4"
        name="theme"
      >
        <div className="flex items-center gap-2">
          <RadioGroup.Item id="theme-default" value="default" />
          <label htmlFor="theme-default" className="leading-4">
            Default
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroup.Item id="theme-eink" value="eink" />
          <label htmlFor="theme-eink" className="leading-4">
            E-ink
          </label>
        </div>
      </RadioGroup>
    </SettingsSection>
  )
}

function FontSection() {
  const [font, setFont] = useAtom(fontAtom)

  return (
    <SettingsSection title="Font">
      <RadioGroup
        aria-labelledby="font-label"
        value={font}
        defaultValue="sans"
        onValueChange={(value) => setFont(value as "sans" | "serif")}
        className="flex flex-col gap-3 coarse:gap-4"
        name="font"
      >
        <div className="flex items-center gap-2">
          <RadioGroup.Item id="font-sans" value="sans" />
          <label htmlFor="font-sans" className="font-sans leading-4">
            Sans-serif
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroup.Item id="font-serif" value="serif" />
          <label htmlFor="font-serif" className="font-serif leading-4">
            Serif
          </label>
        </div>
      </RadioGroup>
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

function AISection() {
  const hasOpenAIKey = useAtomValue(hasOpenAIKeyAtom)
  const [voiceConversationsEnabled, setVoiceConversationsEnabled] = useAtom(
    voiceConversationsEnabledAtom,
  )

  return (
    <SettingsSection title="AI">
      <div className="flex flex-col gap-4">
        <OpenAIKeyInput />
        <div className="flex flex-col gap-3 leading-4 coarse:gap-4">
          <div className="flex items-center gap-3 coarse:gap-4">
            <Switch
              id="voice-conversations"
              disabled={!hasOpenAIKey}
              checked={hasOpenAIKey && voiceConversationsEnabled}
              onCheckedChange={(checked) => setVoiceConversationsEnabled(checked)}
            />
            <label
              htmlFor="voice-conversations"
              className={cx(!hasOpenAIKey && "cursor-not-allowed text-text-secondary")}
            >
              Voice conversations <span className="text-sm italic text-text-secondary">(beta)</span>
            </label>
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}
