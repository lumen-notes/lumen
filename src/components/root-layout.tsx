import { useAtom } from "jotai"
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useEvent, useNetworkState } from "react-use"
import { globalStateMachineAtom } from "../global-state"
import { getPrevPathParams, savePathParams } from "../utils/prev-path-params"
import { ErrorIcon16 } from "./icons"
import { SyntaxHighlighter } from "./syntax-highlighter"
// @ts-ignore
// import LagRadar from "react-lag-radar"

export function RootLayout({ children }: { children: React.ReactNode }) {
  const [state, send] = useAtom(globalStateMachineAtom)
  const location = useLocation()
  const navigate = useNavigate()
  const { online } = useNetworkState()

  // Sync when the app becomes visible again
  useEvent("visibilitychange", () => {
    if (document.visibilityState === "visible" && online) {
      send({ type: "SYNC" })
    }
  })

  // Sync when the app comes back online
  useEvent("online", () => {
    send({ type: "SYNC" })
  })

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
      {/* {import.meta.env.DEV ? (
        <div className="fixed right-4 top-4 rounded-full bg-[black] p-2">
          <LagRadar />
        </div>
      ) : null} */}
      {children}
      {import.meta.env.DEV ? (
        <div className="flex border-t border-border-secondary px-4 py-2">
          <SyntaxHighlighter language="javascript">{JSON.stringify(state.value)}</SyntaxHighlighter>
        </div>
      ) : null}
    </div>
  )
}
