import { useEffect, useRef, useState } from "react"
import { cx } from "../utils/cx"
import { AppHeader, AppHeaderProps } from "./app-header"

type AppLayoutProps = AppHeaderProps & {
  className?: string
  children: React.ReactNode
}

export function AppLayout({ className, children, ...props }: AppLayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLElement>(null)
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

  return (
    <div className="grid grid-rows-[auto_1fr] overflow-hidden">
      <AppHeader
        {...props}
        className={cx("border-b", isScrolled ? "border-border-secondary" : "border-transparent")}
      />
      <main ref={scrollContainerRef} className="relative overflow-auto [scrollbar-gutter:stable]">
        {/* Invisible sentinel element that helps detect scroll position */}
        <div ref={topSentinelRef} className="pointer-events-none absolute top-0 h-[1px] w-full" />
        {children}
      </main>
    </div>
  )
}
