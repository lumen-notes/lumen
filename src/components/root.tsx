import { useActor } from "@xstate/react"
import React from "react"
import { Outlet } from "react-router-dom"
import { GlobalStateContext } from "../global-state"
import { useMedia, useNetworkState, useEvent } from "react-use"
import { pluralize } from "../utils/pluralize"
// import { Button } from "./button"
// import { Card } from "./card"
// import { ErrorIcon16, LoadingIcon16 } from "./icons"
// import { Input } from "./input"
import { NavBar } from "./nav-bar"
import { ErrorIcon16, LoadingIcon16 } from "./icons"
import { Card } from "./card"

export function Root() {
  const globalState = React.useContext(GlobalStateContext)
  const [state, send] = useActor(globalState.service)
  // We consider any viewport wider than 640px a desktop viewport.
  // This breakpoint is copied from Tailwind's default breakpoints.
  // Reference: https://tailwindcss.com/docs/responsive-design
  const isDesktop = useMedia("(min-width: 640px)")

  const { online } = useNetworkState()

  const handleOnline = React.useCallback(() => send("SYNC_NOTES"), [send])

  useEvent("online", handleOnline)

  const unsyncedNoteCount =
    state.context.unsyncedNotes.upserted.size + state.context.unsyncedNotes.deleted.size

  if (state.matches("loadingContext")) {
    return null
  }

  // if (state.matches("signedOut")) {
  //   // TODO: Validate the token
  //   // TODO: Replace with OAuth flow
  //   return (
  //     <div className="grid h-screen w-screen place-items-center [@supports(height:100svh)]:h-[100svh]">
  //       <form
  //         className="grid w-full max-w-md gap-6 p-6"
  //         key="sign-in"
  //         onSubmit={(event) => {
  //           event.preventDefault()
  //           const formData = new FormData(event.currentTarget)
  //           const authToken = formData.get("auth-token")
  //           if (typeof authToken === "string") {
  //             send({ type: "SIGN_IN", data: { authToken } })
  //           }
  //         }}
  //       >
  //         <div className="grid gap-2">
  //           <label htmlFor="auth-token" className="leading-4">
  //             GitHub personal access token
  //           </label>
  //           <Input
  //             id="auth-token"
  //             name="auth-token"
  //             // Pre-fill the token in development mode
  //             defaultValue={import.meta.env.DEV ? import.meta.env.VITE_GITHUB_TOKEN : ""}
  //             required
  //           />
  //           <p className="text-text-secondary">
  //             Generate a new{" "}
  //             <a
  //               className="link"
  //               href="https://github.com/settings/tokens/new"
  //               target="_blank"
  //               rel="noopener noreferrer"
  //             >
  //               personal access token
  //             </a>
  //             , then paste it here. Be sure to give your token "repo" scope.
  //           </p>
  //         </div>
  //         <Button type="submit" variant="primary" className="w-full">
  //           Sign in
  //         </Button>
  //       </form>
  //     </div>
  //   )
  // }

  // if (state.matches("signedIn.selectingRepo")) {
  //   return (
  //     <div className="grid h-screen w-screen place-items-center [@supports(height:100svh)]:h-[100svh]">
  //       <div className="grid w-full max-w-md gap-6 p-6">
  //         <div className="grid gap-2">
  //           <h1 className="text-base font-semibold leading-4">Select a repository</h1>
  //           <p className=" text-text-secondary">
  //             Lumen stores your notes as Markdown files in a GitHub repository of your choice.
  //           </p>
  //         </div>
  //         <form
  //           className="grid gap-6 sm:gap-4"
  //           onSubmit={(event) => {
  //             event.preventDefault()
  //             const formData = new FormData(event.currentTarget)
  //             const repoOwner = formData.get("repo-owner")
  //             const repoName = formData.get("repo-name")
  //             if (typeof repoOwner === "string" && typeof repoName === "string") {
  //               send({ type: "SELECT_REPO", data: { repoOwner, repoName } })
  //             }
  //           }}
  //         >
  //           <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
  //             <div className="grid w-full gap-2">
  //               <label htmlFor="repo-owner" className="leading-4">
  //                 Repository owner
  //               </label>
  //               <Input
  //                 type="text"
  //                 id="repo-owner"
  //                 name="repo-owner"
  //                 defaultValue={state.context.repoOwner}
  //                 required
  //               />
  //             </div>
  //             <div className="grid w-full gap-2">
  //               <label htmlFor="repo-name" className="leading-4">
  //                 Repository name
  //               </label>
  //               <Input
  //                 type="text"
  //                 id="repo-name"
  //                 name="repo-name"
  //                 defaultValue={state.context.repoName}
  //                 required
  //               />
  //             </div>
  //           </div>
  //           <Button type="submit" variant="primary">
  //             Select
  //           </Button>
  //         </form>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div>
      <div className="flex h-screen w-screen flex-col [@supports(height:100svh)]:h-[100svh]">
        {state.context.error ? (
          <div className="flex items-center gap-3 bg-[crimson] py-2 px-4 text-[white]">
            <ErrorIcon16 />
            <span>{state.context.error}</span>
          </div>
        ) : null}
        <div className="flex h-[0%] w-full flex-grow flex-col-reverse sm:flex-row">
          <div className="flex">
            <NavBar position={isDesktop ? "left" : "bottom"} />
          </div>
          <main className="w-full flex-grow overflow-auto">
            <Outlet />
          </main>
        </div>
        {!online ? (
          <div className="flex bg-bg-tertiary py-2 px-4">
            {/* TODO: Offline icon */}
            <span>Offline</span>
            {unsyncedNoteCount > 0 ? (
              <span>
                <span className="px-2">·</span>
                {pluralize(unsyncedNoteCount, "unsynced note")}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      {state.matches("syncingNotes") ? (
        // `bottom-16` ensures that the syncing indicator doesn't overlap
        // the bottom nav bar on mobile
        <div className="fixed bottom-16 right-2 sm:bottom-2">
          <Card
            elevation={1}
            className="flex items-center gap-2 p-2 text-text-secondary"
            role="status"
            aria-label="Loading notes"
          >
            <LoadingIcon16 />
            <span className="leading-4">Syncing...</span>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
