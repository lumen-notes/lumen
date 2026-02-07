import React from "react"
import { cx } from "../utils/cx"

export function Keys({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex gap-px font-normal leading-none tracking-wider text-text-secondary",
        className,
      )}
    >
      {keys.map((key, index) => {
        const isAlphabeticKey = /^[a-zA-Z]$/.test(key)
        return (
          <React.Fragment key={index}>
            {isAlphabeticKey ? <span className="font-sans-mono">{key}</span> : key}
          </React.Fragment>
        )
      })}
    </span>
  )
}
