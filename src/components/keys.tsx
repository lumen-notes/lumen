import React from "react"

export function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex gap-px font-normal leading-none tracking-wider text-text-secondary">
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
