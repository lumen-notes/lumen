import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useNetworkState } from "react-use"
import { globalStateMachineAtom, isRepoClonedAtom } from "../global-state"
import { cx } from "../utils/cx"
import { CheckFillIcon16, ErrorFillIcon16, LoadingFillIcon16 } from "./icons"

const isSyncingAtom = selectAtom(
  globalStateMachineAtom,
  (state) =>
    state.matches("signedIn.cloned.sync.pulling") ||
    state.matches("signedIn.cloned.sync.pushing") ||
    state.matches("signedIn.cloned.sync.checkingStatus"),
)

const isSyncErrorAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned.sync.error"),
)

export function useSyncStatusText() {
  const isSyncing = useAtomValue(isSyncingAtom)
  const isSyncError = useAtomValue(isSyncErrorAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const { online } = useNetworkState()

  if (!isRepoCloned || !online) return null

  if (isSyncing) {
    return "Syncing…"
  }

  if (isSyncError) {
    return <span className="text-text-danger">Sync error</span>
  }

  return "Synced"
}

export function SyncStatusIcon({ className }: { className?: string }) {
  const isSyncing = useAtomValue(isSyncingAtom)
  const isSyncError = useAtomValue(isSyncErrorAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const { online } = useNetworkState()

  if (!isRepoCloned || !online) return null

  if (isSyncing) {
    return <LoadingFillIcon16 className={cx("text-text-pending", className)} />
  }

  if (isSyncError) {
    return <ErrorFillIcon16 className={cx("text-text-danger", className)} />
  }

  return <CheckFillIcon16 className={cx("text-text-success", className)} />
}
