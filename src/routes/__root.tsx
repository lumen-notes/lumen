import { Link, Outlet, ScrollRestoration, createRootRoute } from "@tanstack/react-router"
import { useAtomValue, useSetAtom } from "jotai"
import { useEvent, useNetworkState } from "react-use"
import { CommandMenu } from "../components/command-menu"
import { SignInButton } from "../components/github-auth"
import { globalStateMachineAtom, isSignedOutAtom } from "../global-state"
import { useThemeColor } from "../hooks/theme-color"
import { cx } from "../utils/cx"

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="p-4">
      Page not found.{" "}
      <Link to="/" search={{ query: undefined, view: "grid" }} className="link">
        Go home
      </Link>
    </div>
  )
}

function RootComponent() {
  useThemeColor()
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const send = useSetAtom(globalStateMachineAtom)
  const { online } = useNetworkState()

  // Sync when the app becomes visible again
  useEvent("visibilitychange", () => {
    if (document.visibilityState === "visible" && online) {
      send({ type: "SYNC" })
    }
  })

  useEvent("online", () => {
    send({ type: "SYNC" })
  })

  return (
    <div
      className={cx(
        "grid h-screen w-screen bg-bg pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] [@supports(height:100svh)]:h-[100svh]",
        isSignedOut && "grid-rows-[auto_1fr_auto]",
      )}
      data-vaul-drawer-wrapper=""
    >
      {isSignedOut ? (
        <div className="flex flex-col justify-between gap-3 border-b border-border-secondary p-4 text-text sm:m-0 sm:flex-row sm:items-center sm:p-2">
          <span className="sm:px-2">
            Lumen is in <span className="italic">read-only</span> mode.
            <span className="hidden md:inline"> Sign in to start writing notes.</span>
          </span>
          <SignInButton />
        </div>
      ) : null}
      <ScrollRestoration />
      <Outlet />
      {/* <DevBar /> */}
      <CommandMenu />
    </div>
  )
}

// Shows the current state of the global state machine for debugging purposes
function DevBar() {
  const state = useAtomValue(globalStateMachineAtom)

  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed bottom-2 right-2 flex h-6 items-center rounded bg-bg">
      <div className="flex h-6 items-center gap-1.5 rounded bg-bg-secondary px-2 font-mono text-sm text-text-secondary">
        <span>{formatState(state.value)}</span>
        <span className="text-text-tertiary">·</span>
        <CurrentBreakpoint />
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

function CurrentBreakpoint() {
  return (
    <span>
      <span className="sm:hidden">xs</span>
      <span className="hidden sm:inline md:hidden">sm</span>
      <span className="hidden md:inline lg:hidden">md</span>
      <span className="hidden lg:inline xl:hidden">lg</span>
      <span className="hidden xl:inline 2xl:hidden">xl</span>
      <span className="hidden 2xl:inline">2xl</span>
    </span>
  )
}
