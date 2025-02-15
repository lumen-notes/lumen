import React from "react"
import { IconButton } from "./icon-button"
import { CheckIcon16, CopyIcon16 } from "./icons"
import copy from "copy-to-clipboard"

export function CopyButton({ className, text }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<number | null>(null)

  return (
    <IconButton
      aria-label={copied ? "Copied" : "Copy"}
      className={className}
      tooltipSide="left"
      onClick={() => {
        copy(text)
        setCopied(true)

        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = window.setTimeout(() => setCopied(false), 1000)
      }}
    >
      {copied ? <CheckIcon16 className="text-text-success" /> : <CopyIcon16 />}
    </IconButton>
  )
}
