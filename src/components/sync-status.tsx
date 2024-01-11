import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useNetworkState } from "react-use"
import { globalStateMachineAtom } from "../global-state"
import { CheckIcon12, OfflineIcon16, OfflineIcon24 } from "./icons"

const isSyncSuccessAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned.sync.success"),
)

const isSyncErrorAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned.sync.error"),
)

export function useSyncStatusText() {
  const isSyncSuccess = useAtomValue(isSyncSuccessAtom)
  const isSyncError = useAtomValue(isSyncErrorAtom)
  const { online } = useNetworkState()

  if (!online) {
    return "Offline"
  }

  if (isSyncSuccess) {
    return "Synced"
  }

  if (isSyncError) {
    return "Sync error"
  }

  return "Syncing…"
}

export function SyncStatusIcon({ size }: { size: 16 | 24 }) {
  const isSyncSuccess = useAtomValue(isSyncSuccessAtom)
  const isSyncError = useAtomValue(isSyncErrorAtom)
  const { online } = useNetworkState()

  if (!online) {
    return size === 16 ? <OfflineIcon16 /> : <OfflineIcon24 />
  }

  if (isSyncSuccess) {
    return size === 16 ? <SuccessIcon16 /> : <SuccessIcon24 />
  }

  if (isSyncError) {
    return size === 16 ? <ErrorIcon16 /> : <ErrorIcon24 />
  }

  return size === 16 ? <PendingIcon16 /> : <PendingIcon24 />
}

function SuccessIcon16() {
  return (
    <div className="rounded-full bg-[var(--green-11)] text-bg">
      <svg viewBox="0 0 16" width="16" height="16" fill="currentColor">
        <path d="m12.05 4.85-4.95 6.6a.75.75 0 0 1-1.186.019L3.446 8.383l1.171-.937 1.864 2.33L10.85 3.95l1.2.9Z" />
      </svg>
    </div>
  )
}

function SuccessIcon24() {
  return (
    <div className="grid h-6 w-6 place-items-center rounded-full bg-[var(--green-11)] text-bg dark:bg-[var(--green-a4)] dark:text-[var(--green-a11)] dark:ring-1 dark:ring-inset dark:ring-[var(--green-a4)]">
      <CheckIcon12 />
    </div>
  )
}

function PendingIcon16() {
  return (
    <div className="rounded-full bg-[var(--yellow-11)] text-bg">
      <svg className="animate-spin" viewBox="0 0 16" width="16" height="16" fill="currentColor">
        <path d="M8 3a5 5 0 1 0 5 5h-1.5A3.5 3.5 0 1 1 8 4.5V3Z" />
      </svg>
    </div>
  )
}

function PendingIcon24() {
  return (
    <div className="rounded-full bg-[var(--yellow-11)] text-bg dark:bg-[var(--yellow-a4)] dark:text-[var(--yellow-a11)] dark:ring-1 dark:ring-inset dark:ring-[var(--yellow-a4)]">
      <svg className="animate-spin" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M11 6.083A6.002 6.002 0 0 0 12 18a6 6 0 0 0 6-6h-1.5A4.5 4.5 0 1 1 11 7.612V6.083Z" />
      </svg>
    </div>
  )
}

function ErrorIcon16() {
  return (
    <div className="rounded-full bg-[var(--red-11)] text-bg">
      <svg viewBox="0 0 16" width="16" height="16" fill="currentColor">
        <path d="m8 6.94 2.47-2.47 1.06 1.06L9.06 8l2.47 2.47-1.06 1.06L8 9.06l-2.47 2.47-1.06-1.06L6.94 8 4.47 5.53l1.06-1.06L8 6.94Z" />
      </svg>
    </div>
  )
}

function ErrorIcon24() {
  return (
    <div className="rounded-full bg-[var(--red-11)] text-bg dark:bg-[var(--red-a4)] dark:text-[var(--red-a11)] dark:ring-1 dark:ring-inset dark:ring-[var(--red-a4)]">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12.0001 10.9393L15.4697 7.46967L16.5304 8.53033L13.0607 12L16.5304 15.4697L15.4697 16.5303L12.0001 13.0607L8.53039 16.5303L7.46973 15.4697L10.9394 12L7.46973 8.53033L8.53039 7.46967L12.0001 10.9393Z" />
      </svg>
    </div>
  )
}
