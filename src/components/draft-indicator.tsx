import { cx } from "../utils/cx"
import { DotIcon8 } from "./icons"

export function DraftIndicator({ className }: { className?: string }) {
  return (
    <div aria-label="Unsaved changes" className={cx("grid place-items-center size-4", className)}>
      <DotIcon8 className="text-text-pending" />
    </div>
  )
}
