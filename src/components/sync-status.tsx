import { useAtomValue } from "jotai"
import { useNetworkState } from "react-use"
import { globalStateMachineAtom } from "../global-state"

export function SyncStatus() {
  const state = useAtomValue(globalStateMachineAtom)
  const { online } = useNetworkState()

  if (!online) {
    return <OfflineIcon />
  }

  if (state.matches("signedIn.cloned.sync.idle")) {
    return <SuccessIcon />
  }

  return <PendingIcon />
}

function SuccessIcon() {
  return (
    <div className="rounded-full bg-[hsl(138,55%,43%)] text-bg-inset dark:bg-[hsl(138,66%,15%)] dark:text-[hsl(131,83%,77%)]">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="m16.552 8.613-5.458 7.094a.75.75 0 0 1-1.2-.016l-2.442-3.356 1.213-.883 1.852 2.546 4.846-6.3 1.189.915Z" />
      </svg>
    </div>
  )
}
function PendingIcon() {
  return (
    <div className="rounded-full bg-[hsl(30,78%,47%)] text-bg-inset dark:bg-[hsl(30,85%,15%)] dark:text-[hsl(41,93%,71%)]">
      <svg className="animate-spin" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M11 6.083A6.002 6.002 0 0 0 12 18a6 6 0 0 0 6-6h-1.5A4.5 4.5 0 1 1 11 7.612V6.083Z" />
      </svg>
    </div>
  )
}

function OfflineIcon() {
  return (
    <div className="rounded-full bg-text-secondary text-bg-inset dark:bg-bg-tertiary dark:text-text-secondary">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-3.393 3.668L8.332 9.393a4.5 4.5 0 0 0 6.275 6.275Zm1.061-1.06a4.5 4.5 0 0 0-6.275-6.275l6.275 6.274Z" />
      </svg>
    </div>
  )
}
