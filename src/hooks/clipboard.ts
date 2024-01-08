import { useState } from "react"

export function useClipboard({ timeout = 2000 } = {}): {
  copy: (value: any) => void
  reset: () => void
  error: Error | null
  copied: boolean
} {
  const [error, setError] = useState<Error | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [copyTimeout, setCopyTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleCopyResult = (value: boolean) => {
    clearTimeout(copyTimeout as NodeJS.Timeout | undefined)
    setCopyTimeout(setTimeout(() => setCopied(false), timeout))
    setCopied(value)
  }

  const copy = (valueToCopy: any) => {
    if ("clipboard" in navigator) {
      navigator.clipboard
        .writeText(valueToCopy)
        .then(() => handleCopyResult(true))
        .catch((err) => setError(err))
    } else {
      setError(new Error("useClipboard: navigator.clipboard is not supported"))
    }
  }

  const reset = () => {
    setCopied(false)
    setError(null)
    clearTimeout(copyTimeout as NodeJS.Timeout | undefined)
  }

  return { copy, reset, error, copied }
}
