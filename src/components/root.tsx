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
    return (
      <div>
        <form
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
          <label htmlFor="auth-token">Personal access token</label>
          <input
            type="password"
            id="auth-token"
            name="auth-token"
            // Pre-fill the token in development mode
            defaultValue={import.meta.env.DEV ? import.meta.env.VITE_GITHUB_TOKEN : ""}
            required
          />
          <Button type="submit">Sign in</Button>
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
          <input type="text" id="repo-owner" name="repo-owner" required />
          <label htmlFor="repo-name">Repository name</label>
          <input type="text" id="repo-name" name="repo-name" required />
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
      {state.matches("signedIn.connected.loadingNotes") ? (
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
