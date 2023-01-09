import { useActor } from "@xstate/react"
import React from "react"
import { Outlet } from "react-router-dom"
import { GlobalStateContext } from "../global-state"
// import { Button } from "./button"
import { useMedia } from "react-use"
import { Button } from "./button"
import { Card } from "./card"
import { LoadingIcon16 } from "./icons"
import { NavBar } from "./nav-bar"

export function Root() {
  const globalState = React.useContext(GlobalStateContext)
  const [state, send] = useActor(globalState.service)
  // We consider any viewport wider than 640px a desktop viewport.
  // This breakpoint is copied from Tailwind's default breakpoints.
  // Reference: https://tailwindcss.com/docs/responsive-design
  const isDesktop = useMedia("(min-width: 640px)")

  if (state.matches("loadingContext")) {
    return null
  }

  if (state.matches("signedOut")) {
    // TODO: Validate the token
    // TODO: Replace with OAuth flow
    return (
      <div className="grid h-screen w-screen place-items-center [@supports(height:100svh)]:h-[100svh]">
        <form
          className="grid w-full max-w-md gap-6 p-6"
          key="sign-in"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            const authToken = formData.get("auth-token")
            if (typeof authToken === "string") {
              send({ type: "SIGN_IN", data: { authToken } })
            }
          }}
        >
          <div className="grid gap-2">
            <label htmlFor="auth-token">GitHub personal access token</label>
            <input
              className="w-full rounded bg-bg-secondary px-3 py-2 touch:py-3 touch:px-4"
              type="password"
              id="auth-token"
              name="auth-token"
              // Pre-fill the token in development mode
              defaultValue={import.meta.env.DEV ? import.meta.env.VITE_GITHUB_TOKEN : ""}
              required
            />
            <p className="text-text-secondary">
              Generate a new{" "}
              <a href="https://github.com/settings/tokens/new" className="link">
                personal access token
              </a>
              , then paste it here. Be sure to give your token "repo" scope.
            </p>
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    )
  }

  if (state.matches("signedIn.selectingRepo")) {
    // TODO: Validate the repo owner and name
    return (
      <div>
        <form
          key="select-repo"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            const repoOwner = formData.get("repo-owner")
            const repoName = formData.get("repo-name")
            if (typeof repoOwner === "string" && typeof repoName === "string") {
              send({ type: "SELECT_REPO", data: { repoOwner, repoName } })
            }
          }}
        >
          <label htmlFor="repo-owner">Repository owner</label>
          <input
            type="text"
            id="repo-owner"
            name="repo-owner"
            defaultValue={state.context.repoOwner}
            required
          />
          <label htmlFor="repo-name">Repository name</label>
          <input
            type="text"
            id="repo-name"
            name="repo-name"
            defaultValue={state.context.repoName}
            required
          />
          <Button type="submit">Select</Button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="flex h-screen w-screen flex-col-reverse sm:flex-row [@supports(height:100svh)]:h-[100svh]">
        <div className="flex">
          <NavBar position={isDesktop ? "left" : "bottom"} />
        </div>
        <main className="w-full flex-grow overflow-auto">
          <Outlet />
        </main>
      </div>
      {state.matches("signedIn.loadingNotes") ? (
        <div className="fixed bottom-2 right-2">
          <Card
            elevation={1}
            className="p-2 text-text-secondary"
            role="status"
            aria-label="Loading notes"
          >
            <LoadingIcon16 />
          </Card>
        </div>
      ) : null}
    </div>
  )
}
