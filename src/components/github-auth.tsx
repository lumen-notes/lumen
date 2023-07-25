import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useNavigate } from "react-router-dom"
import { githubRepoAtom, githubUserAtom, rawNotesAtom } from "../global-atoms"
import { cx } from "../utils/cx"
import { Button } from "./button"
import { GitHubAvatar } from "./github-avatar"
import { shaAtom } from "../utils/github-sync"
import { RepositoryPicker } from "./repository-picker"
import { LumenLogo } from "./lumen-logo"
import { Card } from "./card"
import React from "react"

export function GitHubAuth({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate()
  const [githubUser, setGitHubUser] = useAtom(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)

  React.useEffect(() => {
    // Get token and username from URL
    const token = new URLSearchParams(window.location.search).get("token")
    const username = new URLSearchParams(window.location.search).get("username")

    if (token && username) {
      // Save token and username
      setGitHubUser({ token, username })

      // Remove access token from URL
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.delete("token")
      searchParams.delete("username")

      navigate({ search: searchParams.toString() }, { replace: true })
    }
  }, [])

  return !githubUser || !githubRepo ? (
    <div className="flex min-h-screen items-center justify-center pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] coarse:items-end coarse:sm:items-center [@supports(min-height:100svh)]:min-h-[100svh]">
      <div className="flex w-full max-w-sm flex-col items-start p-4">
        <LumenLogo size={24} className="mb-8" />
        {!githubUser ? (
          <>
            <h1 className="mb-1 text-xl font-semibold">Welcome to Lumen</h1>
            <p className="mb-8 text-text-secondary">
              Lumen is a note-taking app for lifelong learners.{" "}
              <a className="link link-external" href="https://uselumen.com">
                Learn more
              </a>
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-xl font-semibold">Choose a repository</h1>
            <p className="mb-8 text-text-secondary">
              Store your notes as markdown files in a GitHub repository of your choice.
            </p>
          </>
        )}
        <div className="grid w-full gap-5">
          <SignedInUser />
          {githubUser ? <RepositoryPicker /> : null}
        </div>
      </div>
    </div>
  ) : (
    <div>{children}</div>
  )
}

export function SignInButton({ className }: { className?: string }) {
  return (
    <Button
      variant="primary"
      className={cx("w-full", className)}
      onClick={() => {
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${
          import.meta.env.VITE_GITHUB_CLIENT_ID
        }&state=${
          // URL to redirect to after signing in
          encodeURIComponent(window.location.href)
        }&scope=repo`
      }}
    >
      Sign in with GitHub
    </Button>
  )
}

export function SignedInUser() {
  const [githubUser, setGitHubUser] = useAtom(githubUserAtom)
  const setGitHubRepo = useSetAtom(githubRepoAtom)
  const setRawNotes = useSetAtom(rawNotesAtom)
  const setSha = useSetAtom(shaAtom)

  if (!githubUser) return <SignInButton />

  return (
    <Card className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <GitHubAvatar username={githubUser.username} />
        <div className="flex flex-col">
          <span className="text-sm">Signed in as</span>
          <span className="font-semibold">@{githubUser.username}</span>
        </div>
      </div>
      <Button
        className="flex-shrink-0"
        onClick={() => {
          setGitHubUser(null)
          setGitHubRepo(null)
          setRawNotes({})
          setSha(null)
        }}
      >
        Sign out
      </Button>
    </Card>
  )
}
