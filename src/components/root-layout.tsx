import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { useEvent, useNetworkState } from "react-use"
import { globalStateMachineAtom } from "../global-state"
import { useThemeColorProvider } from "../utils/use-theme-color"
import { ErrorIcon16 } from "./icons"
import { SyntaxHighlighter } from "./syntax-highlighter"
// @ts-ignore
import LagRadar from "react-lag-radar"

const errorAtom = selectAtom(globalStateMachineAtom, (state) => state.context.error)

export function RootLayout({ children }: { children: React.ReactNode }) {
  useThemeColorProvider()
  const error = useAtomValue(errorAtom)
  const send = useSetAtom(globalStateMachineAtom)
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

  return (
    <div className="flex h-screen w-screen flex-col pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] [@supports(height:100svh)]:h-[100svh]">
      {error ? (
        <div className="flex items-center gap-3 bg-[firebrick] px-4 py-2 text-[white]">
          <div>
            <ErrorIcon16 />
          </div>
          <span className="truncate">{error.message}</span>
        </div>
      ) : null}
      {import.meta.env.DEV ? (
        <div className="fixed bottom-4 right-4 z-20 rounded-full bg-[black] p-2 shadow-lg">
          <LagRadar />
        </div>
      ) : null}
      {children}
      <DevBar />
    </div>
  )
}

// Shows the current state of the global state machine for debugging purposes
function DevBar() {
  const state = useAtomValue(globalStateMachineAtom)

  if (!import.meta.env.DEV) return null

  return (
    <div className="flex border-t border-border-secondary px-4 py-2">
      <SyntaxHighlighter language="javascript">{JSON.stringify(state.value)}</SyntaxHighlighter>
    </div>
  )
}
