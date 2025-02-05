import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useNetworkState } from "react-use"
import { globalStateMachineAtom, isRepoClonedAtom } from "../global-state"
import { cx } from "../utils/cx"
import { CheckFillIcon16, ErrorFillIcon16, LoadingFillIcon16 } from "./icons"

const isSyncSuccessAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned.sync.success"),
)

const isSyncErrorAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned.sync.error"),
)

export function useSyncStatusText() {
  const isSyncSuccess = useAtomValue(isSyncSuccessAtom)
  const isSyncError = useAtomValue(isSyncErrorAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const { online } = useNetworkState()

  if (!isRepoCloned || !online) return null

  if (isSyncSuccess) {
    return "Synced"
  }

  if (isSyncError) {
    return <span className="text-text-danger">Sync error</span>
  }

  return "Syncing…"
}

export function SyncStatusIcon({ className }: { className?: string }) {
  const isSyncSuccess = useAtomValue(isSyncSuccessAtom)
  const isSyncError = useAtomValue(isSyncErrorAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const { online } = useNetworkState()

  if (!isRepoCloned || !online) return null

  if (isSyncSuccess) {
    return <CheckFillIcon16 className={cx("text-[var(--green-11)] eink:text-text", className)} />
  }

  if (isSyncError) {
    return <ErrorFillIcon16 className={cx("text-[var(--red-11)] eink:text-text", className)} />
  }

  return <LoadingFillIcon16 className={cx("text-[var(--yellow-11)] eink:text-text", className)} />
}
