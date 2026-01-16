import { useRouter } from "@tanstack/react-router"
import { useSetAtom } from "jotai"
import { sidebarAtom } from "../global-state"
import { useIsScrolled } from "../hooks/is-scrolled"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { ArrowLeftIcon16, ArrowRightIcon16, SidebarIcon16 } from "./icons"
import { NavItems } from "./nav-items"
import { NewNoteButton } from "./new-note-button"

export function Sidebar() {
  const router = useRouter()
  const setSidebar = useSetAtom(sidebarAtom)
  const { isScrolled, topSentinelProps } = useIsScrolled()

  return (
    <div className="grid w-56 flex-shrink-0 grid-rows-[auto_1fr] overflow-hidden border-r border-border-secondary">
      <div
        className={cx(
          "flex w-full justify-between border-b p-2",
          isScrolled ? "border-border-secondary" : "border-transparent",
        )}
      >
        <IconButton
          aria-label="Hide sidebar"
          shortcut={["⌘", "B"]}
          tooltipAlign="start"
          size="small"
          onClick={() => setSidebar("collapsed")}
        >
          <SidebarIcon16 />
        </IconButton>
        <div className="flex items-center">
          <IconButton
            aria-label="Go back"
            size="small"
            onClick={() => router.history.back()}
            className="group"
          >
            <ArrowLeftIcon16 className="transition-transform group-active:-translate-x-0.5" />
          </IconButton>
          <IconButton
            aria-label="Go forward"
            size="small"
            className="group"
            onClick={() => router.history.forward()}
          >
            <ArrowRightIcon16 className="transition-transform group-active:translate-x-0.5" />
          </IconButton>
          <NewNoteButton />
        </div>
      </div>
      <div className="relative flex scroll-py-2 flex-col gap-2 overflow-auto p-2 pt-0">
        <div {...topSentinelProps} />
        <NavItems />
      </div>
    </div>
  )
}
