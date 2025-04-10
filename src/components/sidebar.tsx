import { useLocation, useNavigate } from "@tanstack/react-router"
import { useSetAtom } from "jotai"
import { sidebarAtom } from "../global-state"
import { useIsScrolled } from "../hooks/is-scrolled"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { PlusIcon16, SidebarFillIcon16 } from "./icons"
import { NavItems } from "./nav-items"
import { useSaveNote } from "../hooks/note"
import { parseQuery } from "../hooks/search"
import { Route as RootRoute } from "../routes/_appRoot.index"

export function Sidebar() {
  const setSidebar = useSetAtom(sidebarAtom)
  const navigate = useNavigate()
  const saveNote = useSaveNote()

  const { isScrolled, topSentinelProps } = useIsScrolled()
  // get the page we're currently in
  const { pathname } = useLocation()
  const { query = "" } = RootRoute.useSearch()

  // Get the tag from /tags/[tag]
  const tag = pathname.split("/tags/")[1]

  // Get tag qualifiers from search query
  const tagQualifiers = parseQuery(query).qualifiers.filter((q) => q.key === "tag" && !q.exclude)

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
            let noteId = `${Date.now()}`
            let content = ""

            // Add tags from URL path and search qualifiers
            if (tag) {
              content += `#${tag}`
            }

            // Add tags from search qualifiers
            const searchTags = tagQualifiers.flatMap((q) => q.values)
            if (searchTags.length > 0) {
              if (content) content += " "
              content += searchTags.map((t) => `#${t}`).join(" ")
            }

            const note = {
              id: noteId,
              content,
            }
            saveNote(note)

            navigate({
              to: "/notes/$",
              params: { _splat: noteId },
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
