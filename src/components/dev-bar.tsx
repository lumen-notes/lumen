import { useAtomValue } from "jotai"
import React from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { globalStateMachineAtom } from "../global-state"

/**
 * Shows the current state of the global state machine for debugging purposes
 */
export function DevBar() {
  const state = useAtomValue(globalStateMachineAtom)

  // Toggle dev bar with ctrl+`
  const [isEnabled, setIsEnabled] = React.useState(false)
  useHotkeys("ctrl+`", () => setIsEnabled((prev) => !prev), {
    enabled: import.meta.env.DEV,
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  })

  if (!isEnabled) return null

  return (
    <div className="fixed bottom-16 left-2 flex h-6 items-center rounded bg-bg sm:bottom-2">
      <div className="flex h-6 items-center gap-1.5 whitespace-nowrap rounded bg-bg-secondary px-2 font-mono text-sm text-text-secondary">
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
