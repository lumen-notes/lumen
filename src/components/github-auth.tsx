import { useAtomValue, useSetAtom } from "jotai"
import React from "react"
import { useNetworkState } from "react-use"
import urlcat from "urlcat"
import { githubUserAtom, globalStateMachineAtom } from "../global-state"
import { cx } from "../utils/cx"
import { shaAtom } from "../utils/github-sync"
import { Button } from "./button"
import { Card } from "./card"
import { GitHubAvatar } from "./github-avatar"
import { LumenLogo } from "./lumen-logo"

export function GitHubAuth({ children }: { children?: React.ReactNode }) {
  const state = useAtomValue(globalStateMachineAtom)

  if (state.matches("resolvingUser")) return null

  return state.matches("signedOut") ? (
    <div className="flex min-h-screen items-center justify-center pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] coarse:items-end coarse:sm:items-center [@supports(min-height:100svh)]:min-h-[100svh]">
      <div className="flex w-full max-w-sm flex-col items-start px-4 py-8">
        <LumenLogo size={24} className="mb-8" />
        <h1 className="mb-1 text-xl font-semibold">Welcome to Lumen</h1>
        <p className="mb-8 text-text-secondary">
          Lumen is a note-taking app for lifelong learners.{" "}
          <a className="link link-external" href="https://uselumen.com">
            Learn more
          </a>
        </p>
        <SignInButton />
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
            const { login, name, email } = await getUser(token)
            send({ type: "SIGN_IN", githubUser: { token, login, name, email } })
          } catch (error) {
            console.error(error)
          }
          return
        }

        window.location.href = urlcat("https://github.com/login/oauth/authorize", {
          client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
          state: window.location.href,
          scope: "repo,gist,user:email",
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
            <GitHubAvatar login={githubUser.login} size={16} className="mr-1 align-middle" />
          ) : null}
          {githubUser.login}
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

async function getUser(token: string) {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (userResponse.status === 401) {
    throw new Error("Invalid token")
  }

  if (!userResponse.ok) {
    throw new Error("Unknown error")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { login, name } = (await userResponse.json()) as any

  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const emails = (await emailResponse.json()) as Array<{ email: string; primary: boolean }>
  const primaryEmail = emails.find((email) => email.primary)

  if (!primaryEmail) {
    throw new Error("No primary email found")
  }

  return { login, name, email: primaryEmail.email }
}
