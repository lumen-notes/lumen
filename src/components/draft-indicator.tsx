import { cx } from "../utils/cx"
import { DotIcon8 } from "./icons"

export function DraftIndicator({ className }: { className?: string }) {
  return (
    <div className={cx("grid place-items-center size-4", className)}>
      <span className="sr-only">Unsaved changes</span>
      <DotIcon8 className="text-text-pending" />
    </div>
  )
}
