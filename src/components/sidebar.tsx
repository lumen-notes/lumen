import { useSetAtom } from "jotai"
import { useEffect, useRef, useState } from "react"
import { sidebarAtom } from "../global-state"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { SidebarFillIcon16 } from "./icons"
import { NavItems } from "./nav-items"

export function Sidebar() {
  const setSidebar = useSetAtom(sidebarAtom)

  // const { isScrolled, scrollContainerRef, topSentinelRef } = useIsScrolled()
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
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
    <div className="grid w-56 flex-shrink-0 grid-rows-[auto_1fr] overflow-hidden border-r border-border-secondary">
      <div
        className={cx(
          "flex w-full border-b p-2",
          isScrolled ? "border-border-secondary" : "border-transparent",
        )}
      >
        <IconButton
          aria-label="Collapse sidebar"
          tooltipSide="right"
          size="small"
          onClick={() => setSidebar("collapsed")}
        >
          <SidebarFillIcon16 />
        </IconButton>
      </div>
      <div
        ref={scrollContainerRef}
        className="relative flex scroll-py-2 flex-col gap-2 overflow-auto p-2 pt-0"
      >
        <div
          ref={topSentinelRef}
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px]"
        />
        <NavItems />
      </div>
    </div>
  )
}
