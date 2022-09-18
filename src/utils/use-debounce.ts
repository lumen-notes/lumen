import React from "react"

export function useDebounce<T>(value: T): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    React.startTransition(() => setDebouncedValue(value))
  }, [value])

  return debouncedValue
}
