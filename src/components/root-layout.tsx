import { useAtom } from "jotai"
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useEvent, useNetworkState } from "react-use"
import { globalStateMachineAtom } from "../global-state"
import { getPrevPathParams, savePathParams } from "../utils/prev-path-params"
import { Card } from "./card"
import { ErrorIcon16, LoadingIcon16 } from "./icons"
import { Button } from "./button"

export function RootLayout({ children }: { children: React.ReactNode }) {
  const [state, send] = useAtom(globalStateMachineAtom)
  const { online } = useNetworkState()

  const onVisibilityChange = React.useCallback(() => {
    if (document.visibilityState === "visible" && online) {
      send({ type: "SYNC" })
    }
  }, [send, online])

  const onOnline = React.useCallback(() => {
    send({ type: "SYNC" })
  }, [send])

  // Sync when the app becomes visible or comes online
  useEvent("visibilitychange", onVisibilityChange)
  useEvent("online", onOnline)

  const location = useLocation()
  const navigate = useNavigate()

  // Restore the previous search params for this path when the app loads if the current search params are empty
  useEvent("load", () => {
    const prevPathParams = getPrevPathParams(location.pathname)

    if (location.search === "" && prevPathParams) {
      navigate({
        pathname: location.pathname,
        search: prevPathParams,
      })
    }
  })

  // Save the search params in localStorage before closing the app
  useEvent("beforeunload", () => {
    savePathParams(location)
  })

  return (
    <div className="flex h-screen w-screen flex-col pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] [@supports(height:100svh)]:h-[100svh]">
      {state.context.error ? (
        <div className="flex items-center gap-3 bg-[firebrick] px-4 py-2 text-[white]">
          <div>
            <ErrorIcon16 />
          </div>
          <span className="truncate">{state.context.error.message}</span>
        </div>
      ) : null}
      {JSON.stringify(state.value)}
      <Button onClick={() => send({ type: "SYNC" })}>Sync</Button>
      {children}
      {!online ? (
        <div className="flex justify-center px-4 py-2 sm:justify-start sm:bg-bg-tertiary">
          <span>Offline</span>
        </div>
      ) : null}
      {state.matches("signedIn.cloningRepo") ? (
        <div className="fixed right-2 top-2 z-10 sm:bottom-2 sm:top-[unset]">
          <Card
            elevation={1}
            className=" flex items-center gap-2 rounded-md p-2 text-text-secondary after:rounded-md"
            role="status"
            aria-label="Cloning repository"
          >
            <LoadingIcon16 />
            <span className="leading-4">Cloning…</span>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
