import React from "react"

// Copied from https://usehooks-ts.com/react-hook/use-debounce
export function useDebounce<T>(value: T, delay: number = 200): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
