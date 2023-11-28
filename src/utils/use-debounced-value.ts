// Copied from https://github.com/mantinedev/mantine/blob/6a5f008c40f46850bbae79ca6c92c472526378fb/src/mantine-hooks/src/use-debounced-value/use-debounced-value.ts

import React from "react"

export function useDebouncedValue<T = unknown>(
  value: T,
  wait: number,
  options = { leading: false },
) {
  const [_value, setValue] = React.useState(value)
  const mountedRef = React.useRef(false)
  const timeoutRef = React.useRef<number | null>(null)
  const cooldownRef = React.useRef(false)

  const cancel = () => window.clearTimeout(timeoutRef.current!)

  React.useEffect(() => {
    if (mountedRef.current) {
      if (!cooldownRef.current && options.leading) {
        cooldownRef.current = true
        React.startTransition(() => {
          setValue(value)
        })
      } else {
        cancel()
        timeoutRef.current = window.setTimeout(() => {
          cooldownRef.current = false
          React.startTransition(() => {
            setValue(value)
          })
        }, wait)
      }
    }
  }, [value, options.leading, wait])

  React.useEffect(() => {
    mountedRef.current = true
    return cancel
  }, [])

  return [_value, cancel] as const
}
