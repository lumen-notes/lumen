import React from "react"
import { cx } from "../utils/cx"

export type LabelProps = {
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function Label({ icon, children, className }: LabelProps) {
  return (
    <div
      className={cx(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2 font-sans text-text-secondary ring-1 ring-inset ring-border-secondary",
        icon && "pl-1.5",
        className,
      )}
    >
      {icon ? (
        <div className="relative size-3">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">{icon}</div>
        </div>
      ) : null}
      {children}
    </div>
  )
}
