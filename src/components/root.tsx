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

  const handleOnline = React.useCallback(() => {
    send("SYNC_NOTES")
  }, [send])

  const handleVisibilityChange = React.useCallback(() => {
    if (document.visibilityState === "visible") {
      send("SYNC_NOTES")
    }
  }, [send])

  // Sync notes when the app comes online or becomes visible.
  useEvent("online", handleOnline)
  useEvent("visibilitychange", handleVisibilityChange)

  const unsyncedNoteCount =
    state.context.unsyncedNotes.upserted.size + state.context.unsyncedNotes.deleted.size

  if (state.matches("loadingContext")) {
    return null
  }

  return (
    <div>
      <div className="flex h-screen w-screen flex-col pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] [@supports(height:100svh)]:h-[100svh]">
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
          <div className="flex justify-center py-2 px-4 text-text-secondary sm:justify-start sm:bg-bg-tertiary">
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
        <div className="fixed top-2 right-2 sm:top-[unset] sm:bottom-2">
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
