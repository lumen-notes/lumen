import { useNavigate } from "@tanstack/react-router"
import { useSetAtom } from "jotai"
import { sidebarAtom } from "../global-state"
import { useIsScrolled } from "../hooks/is-scrolled"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { PlusIcon16, SidebarFillIcon16 } from "./icons"
import { NavItems } from "./nav-items"

export function Sidebar() {
  const setSidebar = useSetAtom(sidebarAtom)
  const navigate = useNavigate()

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
          aria-label="Collapse sidebar"
          tooltipSide="right"
          size="small"
          onClick={() => setSidebar("collapsed")}
        >
          <SidebarFillIcon16 />
        </IconButton>
        <IconButton
          aria-label="New note"
          shortcut={["⌘", "⇧", "O"]}
          size="small"
          onClick={() => {
            navigate({
              to: "/notes/$",
              params: { _splat: `${Date.now()}` },
              search: {
                mode: "write",
                query: undefined,
                view: "grid",
              },
            })
          }}
        >
          <PlusIcon16 />
        </IconButton>
      </div>
      <div className="relative flex scroll-py-2 flex-col gap-2 overflow-auto p-2 pt-0">
        <div {...topSentinelProps} />
        <NavItems />
      </div>
    </div>
  )
}
