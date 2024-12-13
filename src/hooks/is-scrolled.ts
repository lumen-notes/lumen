import { useState, useRef, useEffect, useMemo } from "react"

export function useIsScrolled() {
  const [isScrolled, setIsScrolled] = useState(false)
  // Reference to an invisible element at the top of the content
  // Used to detect when content is scrolled
  const topSentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel) return

    // Create an IntersectionObserver that watches when our sentinel element
    // enters or leaves the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is visible (intersecting), we're at the top (not scrolled)
        // When it's not visible, we've scrolled down
        setIsScrolled(!entry.isIntersecting)
      },
      {
        // Only trigger when sentinel is fully visible/hidden
        threshold: 1.0,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const topSentinelProps = useMemo(() => {
    return {
      ref: topSentinelRef,
      className: "pointer-events-none absolute inset-x-0 top-0 h-[1px]",
    }
  }, [])

  return { isScrolled, topSentinelProps }
}
