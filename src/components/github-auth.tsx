import clsx from "clsx"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { githubRepoAtom, githubUserAtom } from "../global-atoms"
import { cx } from "../utils/cx"
import { shaAtom } from "../utils/github-sync"
import { Button } from "./button"
import { Card } from "./card"
import { GitHubAvatar } from "./github-avatar"
import { Input } from "./input"
import { LumenLogo } from "./lumen-logo"
import { RepoForm } from "./repo-form"
import { LoadingIcon16 } from "./icons"

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
  }, [navigate, setGitHubUser])

  return !githubUser || !githubRepo ? (
    <div className="flex min-h-screen items-center justify-center pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] coarse:items-end coarse:sm:items-center [@supports(min-height:100svh)]:min-h-[100svh]">
      <div className="flex w-full max-w-sm flex-col items-start px-4 py-8">
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
        <div className="grid w-full gap-4">
          <SignedInUser />
          {githubUser ? <RepoForm /> : null}
        </div>
      </div>
    </div>
  ) : (
    <div>{children}</div>
  )
}

function SignInButton({ className }: { className?: string }) {
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
        }&scope=repo,gist`
      }}
    >
      Sign in with GitHub
    </Button>
  )
}

export function SignedInUser() {
  const githubUser = useAtomValue(githubUserAtom)
  const signOut = useSignOut()

  if (!githubUser) {
    return (
      <>
        {import.meta.env.DEV && (
          <>
            <SignInWithToken />
            <div className="h-px bg-border-secondary" />
          </>
        )}
        <SignInButton />
      </>
    )
  }

  return (
    <Card className="flex items-center justify-between px-4 py-4">
      <div className="flex flex-col gap-1 coarse:gap-2">
        <span className="text-sm leading-3 text-text-secondary">Account</span>
        <span className="leading-5">
          <GitHubAvatar username={githubUser.username} size={16} className="mr-1 align-middle" />
          {githubUser.username}
        </span>
      </div>
      <Button className="flex-shrink-0" onClick={signOut}>
        Sign out
      </Button>
    </Card>
  )
}

export function useSignOut() {
  const setGitHubUser = useSetAtom(githubUserAtom)
  const setSha = useSetAtom(shaAtom)

  return () => {
    setGitHubUser(null)

    // Always refetch notes when signing back in
    setSha(null)
  }
}

function SignInWithToken() {
  const githubPersonalTokenInput = "github-personal-token"
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  return (
    <form
      className="flex flex-grow flex-col gap-4"
      onSubmit={async (event) => {
        setIsLoading(true)
        event.preventDefault()
        try {
          const formData = new FormData(event.currentTarget)
          const githubPersonalToken = String(formData.get(githubPersonalTokenInput))
          const username = await getUsername(githubPersonalToken)
          window.location.href = `/?token=${githubPersonalToken}&username=${username}`
        } catch (error) {
          console.error("UseGithubToken", error)
          // @ts-ignore
          setErrorMessage(error.toString())
        } finally {
          setIsLoading(false)
        }
      }}
    >
      <Input
        name={githubPersonalTokenInput}
        placeholder="GitHub Personal Token"
        spellCheck={false}
        required
      />
      <h4 className={clsx("text-center text-text-danger", !errorMessage && "hidden")}>
        {errorMessage}
      </h4>
      <Button variant="primary" type="submit" disabled={isLoading}>
        {isLoading ? <LoadingIcon16 /> : "Use GitHub Personal Token"}
      </Button>
    </form>
  )
}

async function getUsername(token: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (response.status === 401) {
    throw new Error("Invalid token")
  }
  if (!response.ok) {
    throw new Error("Unknown error")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { login: username } = (await response.json()) as any

  return username
}
