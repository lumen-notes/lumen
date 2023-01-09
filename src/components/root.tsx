import { useActor } from "@xstate/react"
import React from "react"
import { Outlet } from "react-router-dom"
import { GlobalStateContext } from "../global-state"
// import { Button } from "./button"
import { Card } from "./card"
import { LoadingIcon16 } from "./icons"
import { NavBar } from "./nav-bar"
import { useMedia } from "react-use"
import { Button } from "./button"

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
      <div className="grid h-screen place-items-center p-4 [@supports(height:100svh)]:h-[100svh]">
        <Button
          onClick={() => {
            // TODO: Use a proper OAuth flow
            send({ type: "SIGN_IN", data: { authToken: import.meta.env.VITE_GITHUB_TOKEN } })
          }}
        >
          Sign in with GitHub
        </Button>
      </div>
    )
  }

  if (state.matches("signedIn.selectingRepo")) {
    // TODO: Validate the repo owner and name
    return (
      <div>
        <form
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
