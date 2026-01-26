import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useAtom, useAtomValue } from "jotai"
import { useRef, useState } from "react"
import { useNetworkState } from "react-use"
import { Button } from "../components/button"
import { useSignOut } from "../components/github-auth"
import { GitHubAvatar } from "../components/github-avatar"
import { LoadingIcon16, SettingsIcon16 } from "../components/icons"
import { OpenAIKeyInput } from "../components/openai-key-input"
import { PageLayout } from "../components/page-layout"
import { RepoForm } from "../components/repo-form"
import { Signature } from "../components/signature"
import { Switch } from "../components/switch"
import {
  epaperAtom,
  githubRepoAtom,
  githubUserAtom,
  hasOpenAIKeyAtom,
  isCloningRepoAtom,
  isRepoClonedAtom,
  isRepoNotClonedAtom,
  vimModeAtom,
  voiceAssistantEnabledAtom,
} from "../global-state"
import { useCalendarNotesDirectory, useConfig, useSaveConfig } from "../hooks/config"
import { cx } from "../utils/cx"

export const Route = createFileRoute("/_appRoot/settings")({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Settings · Lumen" }],
  }),
})

function RouteComponent() {
  return (
    <PageLayout title="Settings" icon={<SettingsIcon16 />} disableGuard>
      <div className="p-4 pb-6">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <GitHubSection />
          <NotesSection />
          <AppearanceSection />
          <EditorSection />
          <AISection />
          <div className="p-5 text-text-tertiary self-center flex flex-col gap-3 items-center">
            <span className="text-sm">
              Made by{" "}
              <a
                className="link decoration-text-tertiary"
                href="https://colebemis.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cole Bemis
              </a>{" "}
              &{" "}
              <a
                className="link decoration-text-tertiary"
                href="https://github.com/lumen-notes/lumen/graphs/contributors"
                target="_blank"
                rel="noopener noreferrer"
              >
                friends
              </a>
            </span>
            <a href="https://colebemis.com" target="_blank" rel="noopener noreferrer">
              <Signature width={100} />
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
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
        <div className="text-text-secondary">You're not signed in.</div>
      </SettingsSection>
    )
  }

  return (
    <SettingsSection title="GitHub">
      <div className="flex items-center justify-between gap-4">
        <div className="flex w-0 grow flex-col gap-1">
          <span className="text-sm leading-4 text-text-secondary">Account</span>
          <span className="flex items-center gap-2 leading-4">
            {online ? <GitHubAvatar login={githubUser.login} size={16} /> : null}
            <span className="truncate">{githubUser.login}</span>
          </span>
        </div>
        <Button
          className="shrink-0"
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
            <div className="flex w-0 grow flex-col items-start gap-1">
              <span className="text-sm leading-4 text-text-secondary">Repository</span>
              <a
                href={`https://github.com/${githubRepo.owner}/${githubRepo.name}`}
                className="link leading-5"
                target="_blank"
                rel="noopener noreferrer"
              >
                {githubRepo.owner}/{githubRepo.name}
              </a>
            </div>
            <Button className="shrink-0" onClick={() => setIsEditingRepo(true)}>
              Change
            </Button>
          </div>
        ) : null}
      </div>
    </SettingsSection>
  )
}

function NotesSection() {
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const config = useConfig()
  const calendarNotesDir = useCalendarNotesDirectory()
  const saveConfig = useSaveConfig()
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(calendarNotesDir)
  const inputRef = useRef<HTMLInputElement>(null)

  // Don't show this section if no repo is cloned
  if (!isRepoCloned) {
    return null
  }

  const handleSave = () => {
    saveConfig({
      ...config,
      calendarNotesDirectory: inputValue.trim() || undefined,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setInputValue(calendarNotesDir)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  return (
    <SettingsSection title="Notes">
      <div className="flex flex-col gap-1">
        <span className="text-sm leading-4 text-text-secondary">Calendar notes directory</span>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 rounded border border-border-secondary bg-bg-secondary px-2 py-1 text-sm leading-5 outline-none focus:border-border-focus"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., journal or daily"
              autoFocus
            />
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <span className="leading-5 text-text-primary">
              {calendarNotesDir ? (
                <code className="rounded bg-bg-secondary px-1.5 py-0.5 text-sm">
                  {calendarNotesDir}/
                </code>
              ) : (
                <span className="text-text-secondary">Repository root</span>
              )}
            </span>
            <Button
              onClick={() => {
                setInputValue(calendarNotesDir)
                setIsEditing(true)
              }}
            >
              Change
            </Button>
          </div>
        )}
        <span className="mt-1 text-xs leading-4 text-text-tertiary">
          Directory where daily and weekly notes are stored (e.g., 2025-01-26.md).
          Leave empty to use the repository root.
        </span>
      </div>
    </SettingsSection>
  )
}

function AppearanceSection() {
  const [epaper, setEpaper] = useAtom(epaperAtom)

  return (
    <SettingsSection title="Appearance">
      <div className="flex items-center gap-2.5 leading-4">
        <Switch id="epaper" checked={epaper} onCheckedChange={setEpaper} />
        <label htmlFor="epaper" className="select-none">
          E-paper
        </label>
      </div>
    </SettingsSection>
  )
}

function EditorSection() {
  const [vimMode, setVimMode] = useAtom(vimModeAtom)

  return (
    <SettingsSection title="Editor">
      <div className="flex items-center gap-2.5 leading-4">
        <Switch id="vim-mode" checked={vimMode} onCheckedChange={setVimMode} />
        <label htmlFor="vim-mode" className="select-none">
          Vim mode
        </label>
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
          <div className="flex items-start gap-2.5">
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
