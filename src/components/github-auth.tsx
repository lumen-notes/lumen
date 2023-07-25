import { useAtom, useSetAtom } from "jotai"
import { useNavigate } from "react-router-dom"
import { useEvent } from "react-use"
import { githubUserAtom } from "../global-atoms"
import { cx } from "../utils/cx"
import { Button } from "./button"
import { GitHubAvatar } from "./github-avatar"

export function GitHubAuth() {
  const navigate = useNavigate()
  const setGitHubUser = useSetAtom(githubUserAtom)

  useEvent("load", () => {
    // Get token and username from URL
    const token = new URLSearchParams(window.location.search).get("token")
    const username = new URLSearchParams(window.location.search).get("username")

    if (!token || !username) return

    // Save token and username
    setGitHubUser({ token, username })

    // Remove access token from URL
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.delete("token")
    searchParams.delete("username")

    navigate({ search: searchParams.toString() }, { replace: true })
  })

  return null
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

  if (!githubUser) return <SignInButton />

  return (
    <div className="flex items-center justify-between rounded-sm bg-bg-secondary p-3">
      <div className="flex items-center gap-2">
        <GitHubAvatar username={githubUser.username} />
        <div className="flex flex-col">
          <span className="text-sm">Signed in as</span>
          <span className="font-semibold">{githubUser.username}</span>
        </div>
      </div>
      <Button
        className="flex-shrink-0"
        onClick={() => {
          setGitHubUser(null)
        }}
      >
        Sign out
      </Button>
    </div>
  )
}
