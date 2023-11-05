import { useAtomValue, useSetAtom } from "jotai"
import React from "react"
import urlcat from "urlcat"
import { githubUserAtom, globalStateMachineAtom } from "../global-state"
import { cx } from "../utils/cx"
import { shaAtom } from "../utils/github-sync"
import { Button } from "./button"
import { Card } from "./card"
import { GitHubAvatar } from "./github-avatar"
import { LumenLogo } from "./lumen-logo"
import { RepoForm } from "./repo-form"
import { useNetworkState } from "react-use"

export function GitHubAuth({ children }: { children?: React.ReactNode }) {
  const state = useAtomValue(globalStateMachineAtom)

  if (state.matches("initializingGitHubUser")) return null

  return state.matches("signedOut") || state.matches("signedIn.empty") ? (
    <div className="flex min-h-screen items-center justify-center pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] coarse:items-end coarse:sm:items-center [@supports(min-height:100svh)]:min-h-[100svh]">
      <div className="flex w-full max-w-sm flex-col items-start px-4 py-8">
        <LumenLogo size={24} className="mb-8" />
        {state.matches("signedOut") ? (
          <>
            <h1 className="mb-1 text-xl font-semibold">Welcome to Lumen</h1>
            <p className="mb-8 text-text-secondary">
              Lumen is a note-taking app for lifelong learners.{" "}
              <a className="link link-external" href="https://uselumen.com">
                Learn more
              </a>
            </p>
            <SignInButton />
          </>
        ) : null}
        {state.matches("signedIn.empty") ? (
          <>
            <h1 className="mb-1 text-xl font-semibold">Choose a repository</h1>
            <p className="mb-8 text-text-secondary">
              Store your notes as markdown files in a GitHub repository of your choice.
            </p>
            <div className="grid w-full gap-4">
              <SignedInUser />
              <RepoForm />
            </div>
          </>
        ) : null}
      </div>
    </div>
  ) : (
    <div>{children}</div>
  )
}

function SignInButton({ className }: { className?: string }) {
  const send = useSetAtom(globalStateMachineAtom)
  return (
    <Button
      variant="primary"
      className={cx("w-full", className)}
      onClick={async () => {
        // Sign in with a personal access token in local development
        if (import.meta.env.DEV && import.meta.env.VITE_GITHUB_PAT) {
          try {
            const token = import.meta.env.VITE_GITHUB_PAT
            const username = await getUsername(token)
            send({ type: "SIGN_IN", githubUser: { token, username } })
          } catch (error) {
            console.error(error)
          }
          return
        }

        window.location.href = urlcat("https://github.com/login/oauth/authorize", {
          client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
          state: window.location.href,
          scope: "repo,gist",
        })
      }}
    >
      Sign in with GitHub
    </Button>
  )
}

export function SignedInUser() {
  const githubUser = useAtomValue(githubUserAtom)
  const signOut = useSignOut()
  const { online } = useNetworkState()

  if (!githubUser) return null

  return (
    <Card className="flex items-center justify-between px-4 py-4">
      <div className="flex flex-col gap-1 coarse:gap-2">
        <span className="text-sm leading-3 text-text-secondary">Account</span>
        <span className="leading-5">
          {online ? (
            <GitHubAvatar username={githubUser.username} size={16} className="mr-1 align-middle" />
          ) : null}
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
  const send = useSetAtom(globalStateMachineAtom)
  const setSha = useSetAtom(shaAtom)

  return () => {
    send({ type: "SIGN_OUT" })

    // Always refetch notes when signing back in
    setSha(null)
  }
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
