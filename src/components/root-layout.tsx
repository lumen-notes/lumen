import { useAtomValue, useSetAtom } from "jotai"
import React from "react"
import { useEvent, useNetworkState } from "react-use"
import { globalStateMachineAtom, isSignedOutAtom } from "../global-state"
import { useThemeColorProvider } from "../hooks/theme-color"
import { SignInButton } from "./github-auth"
import { CommandMenu } from "./command-menu"

// const errorAtom = selectAtom(globalStateMachineAtom, (state) => state.context.error)

export function RootLayout({ children }: { children: React.ReactNode }) {
  useThemeColorProvider()
  const isSignedOut = useAtomValue(isSignedOutAtom)
  // const error = useAtomValue(errorAtom)
  const send = useSetAtom(globalStateMachineAtom)
  const { online } = useNetworkState()
  // const location = useLocation()

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
    <>
      <CommandMenu />
      <div className="grid h-screen w-screen pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] [@supports(height:100svh)]:h-[100svh]">
        {isSignedOut ? (
          <div className="flex flex-col justify-between gap-3 border-b border-border-secondary p-4 text-text sm:m-0 sm:flex-row sm:items-center sm:p-2">
            <span className="sm:px-2">
              Lumen is in <span className="italic">read-only</span> mode.
              <span className="hidden md:inline"> Sign in to start writing notes.</span>
            </span>
            <SignInButton />
          </div>
        ) : null}
        {children}
        <DevBar />
      </div>
    </>
  )

  // return (
  //   <Panels.Provider key={location.pathname}>
  //     <CommandMenu />
  //     <InsertTemplateDialog />
  //     <div className="flex h-screen w-screen flex-col pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] [@supports(height:100svh)]:h-[100svh]">
  //       {isReadOnly ? (
  //         <div
  //           className="flex flex-col justify-between gap-3 bg-bg p-4 text-text sm:m-0 sm:flex-row sm:items-center sm:p-2"
  //           style={{
  //             // @ts-ignore
  //             "--color-text": "var(--cyan-12)",
  //             "--color-bg": "var(--cyan-4)",
  //           }}
  //         >
  //           <span className="sm:px-2">
  //             Lumen is in read-only mode.
  //             <span className="hidden md:inline"> Sign in to start writing notes.</span>
  //           </span>
  //           <SignInButton />
  //         </div>
  //       ) : null}
  //       {children}
  //       {error ? (
  //         <div className="flex items-center gap-3 bg-[var(--red-a4)] px-4 py-2 text-[var(--red-12)]">
  //           <div>
  //             <ErrorIcon16 />
  //           </div>
  //           <span className="font-mono">{error.message}</span>
  //         </div>
  //       ) : null}
  //       <DevBar />
  //     </div>
  //   </Panels.Provider>
  // )
}

// Shows the current state of the global state machine for debugging purposes

function DevBar() {
  const state = useAtomValue(globalStateMachineAtom)

  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed bottom-2 right-2 flex h-6 items-center rounded bg-bg">
      <div className="flex h-6 items-center rounded bg-bg-secondary px-2 font-mono text-sm text-text-secondary">
        {formatState(state.value)}
      </div>
    </div>
  )
}

function formatState(state: Record<string, unknown> | string): string {
  if (typeof state === "string") {
    return state
  }

  const entries = Object.entries(state)

  if (entries.length === 0) {
    return ""
  }

  if (entries.length === 1) {
    const [key, value] = entries[0]
    return `${key}.${formatState(value as Record<string, unknown> | string)}`
  }

  return `[${entries
    .map(([key, value]) => `${key}.${formatState(value as Record<string, unknown> | string)}`)
    .join("|")}]`
}
