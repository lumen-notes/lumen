import { useCallback, useRef, useEffect } from "react"

export function useGetter<T>(value: T) {
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])
  return useCallback(() => valueRef.current, [])
}
