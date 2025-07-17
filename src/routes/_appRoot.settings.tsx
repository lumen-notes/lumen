import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import { useNetworkState } from "react-use"
import { AppLayout } from "../components/app-layout"
import { Button } from "../components/button"
import { useSignOut } from "../components/github-auth"
import { GitHubAvatar } from "../components/github-avatar"
import { LoadingIcon16, SettingsIcon16, TrashIcon16 } from "../components/icons"
import { OpenAIKeyInput } from "../components/openai-key-input"
import { RadioGroup } from "../components/radio-group"
import { RepoForm } from "../components/repo-form"
import { Switch } from "../components/switch"
import {
  availableReposAtom,
  defaultFontAtom,
  githubRepoAtom,
  githubUserAtom,
  globalStateMachineAtom,
  hasOpenAIKeyAtom,
  isCloningRepoAtom,
  isRepoClonedAtom,
  isRepoNotClonedAtom,
  themeAtom,
  voiceAssistantEnabledAtom,
} from "../global-state"
import { useEditorSettings } from "../hooks/editor-settings"
import { Font } from "../schema"
import { cx } from "../utils/cx"

export const Route = createFileRoute("/_appRoot/settings")({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Settings · Lumen" }],
  }),
})

function RouteComponent() {
  return (
    <AppLayout title="Settings" icon={<SettingsIcon16 />} disableGuard>
      <div className="p-4 pb-[50vh]">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <GitHubSection />
          <ThemeSection />
          <FontSection />
          <EditorSection />
          <AISection />
          <p className="font-handwriting text-text-secondary text-center mt-2">
            Made by{" "}
            <a
              className="link"
              href="https://github.com/colebemis"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cole Bemis
            </a>{" "}
            &amp;{" "}
            <a
              className="link whitespace-nowrap"
              href="https://github.com/lumen-notes/lumen/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
            >
              friends
            </a>
          </p>
        </div>
      </div>
    </AppLayout>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-bold leading-4">{title}</h3>
      <div className="card-1 p-4">{children}</div>
    </div>
  )
}

function GitHubSection() {
  const navigate = useNavigate()
  const send = useSetAtom(globalStateMachineAtom)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const availableRepos = useAtomValue(availableReposAtom)
  const isRepoNotCloned = useAtomValue(isRepoNotClonedAtom)
  const isCloningRepo = useAtomValue(isCloningRepoAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const signOut = useSignOut()
  const { online } = useNetworkState()
  const [isAddingRepo, setIsAddingRepo] = useState(false)

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
      
      <div className="mt-4 border-t border-border-secondary pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Repositories</h4>
          <Button
            size="sm"
            onClick={() => setIsAddingRepo(!isAddingRepo)}
            disabled={isCloningRepo}
          >
            {isAddingRepo ? "Cancel" : "Add Repository"}
          </Button>
        </div>

        {isAddingRepo ? (
          <div className="mb-4">
            <RepoForm
              onSubmit={() => setIsAddingRepo(false)}
              onCancel={() => setIsAddingRepo(false)}
            />
          </div>
        ) : null}

        {isCloningRepo ? (
          <div className="flex items-center gap-2 leading-4 text-text-secondary mb-4">
            <LoadingIcon16 />
            Adding repository...
          </div>
        ) : null}

        {availableRepos.length > 0 ? (
          <div className="space-y-2">
            {availableRepos.map((repo) => (
              <div
                key={`${repo.owner}/${repo.name}`}
                className={cx(
                  "flex items-center justify-between gap-4 p-3 rounded-lg border",
                  githubRepo?.owner === repo.owner && githubRepo?.name === repo.name
                    ? "border-border-focus bg-bg-secondary"
                    : "border-border-secondary"
                )}
              >
                <div className="flex w-0 flex-grow flex-col gap-1">
                  <a
                    href={`https://github.com/${repo.owner}/${repo.name}`}
                    className="link leading-5"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {repo.owner}/{repo.name}
                  </a>
                  {githubRepo?.owner === repo.owner && githubRepo?.name === repo.name && (
                    <span className="text-xs text-text-secondary">Current repository</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {githubRepo?.owner !== repo.owner || githubRepo?.name !== repo.name ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        send({ type: "SELECT_REPO", githubRepo: repo })
                      }}
                    >
                      Switch
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${repo.owner}/${repo.name}?`)) {
                        send({ type: "REMOVE_REPO", githubRepo: repo })
                      }
                    }}
                  >
                    <TrashIcon16 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : !isRepoNotCloned && !isAddingRepo ? (
          <div className="text-text-secondary">No repositories available.</div>
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
          <label htmlFor="theme-default" className="select-none leading-4">
            Default
          </label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroup.Item id="theme-eink" value="eink" />
          <label htmlFor="theme-eink" className="select-none leading-4">
            E-ink
          </label>
        </div>
      </RadioGroup>
    </SettingsSection>
  )
}

function FontSection() {
  const [defaultFont, setDefaultFont] = useAtom(defaultFontAtom)

  const fonts: Record<Font, string> = {
    sans: "Sans serif",
    serif: "Serif",
    handwriting: "Handwriting",
  }

  return (
    <SettingsSection title="Font">
      <RadioGroup
        aria-labelledby="font-label"
        value={defaultFont}
        defaultValue="sans"
        onValueChange={(value) => setDefaultFont(value as Font)}
        className="flex flex-col gap-3 coarse:gap-4"
        name="font"
      >
        {Object.entries(fonts).map(([font, name]) => (
          <div key={font} className="flex items-center gap-2">
            <RadioGroup.Item id={`font-${font}`} value={font} />
            <label htmlFor={`font-${font}`} className="select-none leading-4">
              {name}
            </label>
          </div>
        ))}
      </RadioGroup>
    </SettingsSection>
  )
}

function EditorSection() {
  const [editorSettings, setEditorSettings] = useEditorSettings()

  return (
    <SettingsSection title="Editor">
      <div className="flex flex-col gap-3 leading-4 coarse:gap-4">
        <div className="flex items-center gap-3">
          <Switch
            id="vim-mode"
            defaultChecked={editorSettings.vimMode}
            onCheckedChange={(checked) => setEditorSettings({ vimMode: checked })}
          />
          <label htmlFor="vim-mode" className="select-none">
            Vim mode
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="line-numbers"
            defaultChecked={editorSettings.lineNumbers}
            onCheckedChange={(checked) => setEditorSettings({ lineNumbers: checked })}
          />
          <label htmlFor="line-numbers" className="select-none">
            Line numbers
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="fold-gutter"
            defaultChecked={editorSettings.foldGutter}
            onCheckedChange={(checked) => setEditorSettings({ foldGutter: checked })}
          />
          <label htmlFor="fold-gutter" className="select-none">
            Fold gutter
          </label>
        </div>
      </div>
    </SettingsSection>
  )
}

function AISection() {
  const hasOpenAIKey = useAtomValue(hasOpenAIKeyAtom)
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useAtom(voiceAssistantEnabledAtom)

  return (
    <SettingsSection title="AI">
      <div className="flex flex-col gap-4">
        <OpenAIKeyInput />
        <div role="separator" className="h-px bg-border-secondary" />
        <div className="flex flex-col gap-3 leading-4 coarse:gap-4">
          <div className="flex items-start gap-3">
            <Switch
              id="voice-assistant"
              disabled={!hasOpenAIKey}
              checked={hasOpenAIKey && voiceAssistantEnabled}
              onCheckedChange={(checked) => setVoiceAssistantEnabled(checked)}
            />
            <div className="flex flex-col gap-2 leading-4 coarse:leading-5">
              <label
                htmlFor="voice-assistant"
                className={cx(
                  "select-none",
                  !hasOpenAIKey && "cursor-not-allowed text-text-secondary",
                )}
              >
                Voice assistant <span className="italic text-text-secondary">(beta)</span>
              </label>
              <Link
                to="/notes/$"
                params={{ _splat: ".lumen/voice-instructions" }}
                search={{ mode: "write", query: undefined, view: "grid" }}
                className="link text-text-secondary"
              >
                Custom instructions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}
