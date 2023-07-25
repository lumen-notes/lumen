import { useSetAtom } from "jotai"
import { useNavigate } from "react-router-dom"
import { useEvent } from "react-use"
import { githubTokenAtom } from "../global-atoms"
import { cx } from "../utils/cx"
import { Button } from "./button"

export function GitHubAuth() {
  const navigate = useNavigate()
  const setGitHubToken = useSetAtom(githubTokenAtom)

  useEvent("load", () => {
    // Get access token from URL
    const accessToken = new URLSearchParams(window.location.search).get("access_token")

    if (!accessToken) return

    // Save access token
    setGitHubToken(accessToken)

    // Remove access token from URL
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.delete("access_token")

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
