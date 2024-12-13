import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { useNetworkState } from "react-use"
import { globalStateMachineAtom, isRepoClonedAtom } from "../global-state"
import { IconButton, IconButtonProps } from "./icon-button"
import { CheckIcon8, LoadingIcon12, OfflineIcon16, XIcon8 } from "./icons"

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

  if (!online) {
    return (
      <div className="grid h-6 w-8 place-items-center text-text-secondary coarse:h-10 coarse:w-10">
        <OfflineIcon16 />
      </div>
    )
  }

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
      <SyncStatusIcon />
    </IconButton>
  )
}

export function useSyncStatusText() {
  const isSyncSuccess = useAtomValue(isSyncSuccessAtom)
  const isSyncError = useAtomValue(isSyncErrorAtom)

  if (isSyncSuccess) {
    return "Synced"
  }

  if (isSyncError) {
    return "Sync error"
  }

  return "Syncing…"
}

export function SyncStatusIcon() {
  const isSyncSuccess = useAtomValue(isSyncSuccessAtom)
  const isSyncError = useAtomValue(isSyncErrorAtom)

  if (isSyncSuccess) {
    return <SuccessIcon16 />
  }

  if (isSyncError) {
    return <ErrorIcon16 />
  }

  return <PendingIcon16 />
}

function SuccessIcon16() {
  return (
    <div className="grid h-4 w-4 place-items-center rounded-full bg-[var(--green-11)] text-bg">
      <CheckIcon8 />
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

function ErrorIcon16() {
  return (
    <div className="grid h-4 w-4 place-items-center rounded-full bg-[var(--red-11)] text-bg">
      <XIcon8 />
    </div>
  )
}
