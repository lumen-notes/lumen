import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { useNetworkState } from "react-use"
import { globalStateMachineAtom, isRepoClonedAtom } from "../global-state"
import {
  CheckIcon12,
  CheckIcon8,
  CloseIcon12,
  XIcon8,
  OfflineIcon16,
  OfflineIcon24,
  LoadingIcon12,
} from "./icons"
import { IconButton, IconButtonProps } from "./icon-button"

const isSyncSuccessAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned.sync.success"),
)

const isSyncErrorAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned.sync.error"),
)

export function SyncIconButton(props: Omit<IconButtonProps, "aria-label">) {
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const send = useSetAtom(globalStateMachineAtom)
  const statusText = useSyncStatusText()
  const { online } = useNetworkState()

  if (!isRepoCloned) return null

  return (
    <IconButton
      aria-label={statusText}
      disabled={!online}
      {...props}
      onClick={(event) => {
        send({ type: "SYNC" })
        props.onClick?.(event)
      }}
    >
      <SyncStatusIcon size={16} />
    </IconButton>
  )
}

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
    <div className="grid h-4 w-4 place-items-center rounded-full bg-[var(--green-11)] text-bg">
      <CheckIcon8 />
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
    <div className="grid h-4 w-4 place-items-center rounded-full bg-[var(--yellow-11)] text-bg">
      <LoadingIcon12 />
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
    <div className="grid h-4 w-4 place-items-center rounded-full bg-[var(--red-11)] text-bg">
      <XIcon8 />
    </div>
  )
}

function ErrorIcon24() {
  return (
    <div className="grid h-6 w-6 place-items-center rounded-full bg-[var(--red-11)] text-bg dark:bg-[var(--red-a4)] dark:text-[var(--red-a11)] dark:ring-1 dark:ring-inset dark:ring-[var(--red-a4)]">
      <CloseIcon12 />
    </div>
  )
}
