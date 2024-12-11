import { Link, LinkComponentProps } from "@tanstack/react-router"
import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { useEffect, useRef, useState } from "react"
import { notesAtom, pinnedNotesAtom, sidebarAtom } from "../global-state"
import { cx } from "../utils/cx"
import { toDateString, toWeekString } from "../utils/date"
import { IconButton } from "./icon-button"
import {
  CalendarDateFillIcon16,
  CalendarDateIcon16,
  CalendarFillIcon16,
  CalendarIcon16,
  NoteFillIcon16,
  NoteIcon16,
  SettingsFillIcon16,
  SettingsIcon16,
  SidebarFillIcon16,
  TagFillIcon16,
  TagIcon16,
} from "./icons"
import { NoteFavicon } from "./note-favicon"

const hasDailyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toDateString(new Date())))
const hasWeeklyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toWeekString(new Date())))

export function Sidebar() {
  const pinnedNotes = useAtomValue(pinnedNotesAtom)
  const hasDailyNote = useAtomValue(hasDailyNoteAtom)
  const hasWeeklyNote = useAtomValue(hasWeeklyNoteAtom)
  const setSidebar = useSetAtom(sidebarAtom)

  const today = new Date()
  const todayString = toDateString(today)
  const weekString = toWeekString(today)

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
        <ul className="flex flex-col gap-1">
          <NavLink
            to="/"
            search={{ query: undefined }}
            activeIcon={<NoteFillIcon16 />}
            inactiveIcon={<NoteIcon16 />}
          >
            Notes
          </NavLink>
          <NavLink
            to="/notes/$"
            params={{ _splat: todayString }}
            search={{
              mode: hasDailyNote ? "read" : "write",
              query: undefined,
            }}
            activeIcon={<CalendarDateFillIcon16 date={today.getDate()} />}
            inactiveIcon={<CalendarDateIcon16 date={today.getDate()} />}
          >
            Today
          </NavLink>
          <NavLink
            to="/notes/$"
            params={{ _splat: weekString }}
            search={{
              mode: hasWeeklyNote ? "read" : "write",
              query: undefined,
            }}
            activeIcon={<CalendarFillIcon16 />}
            inactiveIcon={<CalendarIcon16 />}
          >
            This week
          </NavLink>
          <NavLink
            to="/tags"
            search={{ query: undefined }}
            activeIcon={<TagFillIcon16 />}
            inactiveIcon={<TagIcon16 />}
          >
            Tags
          </NavLink>
          <NavLink
            to="/settings"
            search={{ query: undefined }}
            activeIcon={<SettingsFillIcon16 />}
            inactiveIcon={<SettingsIcon16 />}
          >
            Settings
          </NavLink>
        </ul>
        <div className="flex flex-col gap-1">
          <div className="flex h-8 items-center gap-2 px-2 text-sm text-text-secondary">Pinned</div>
          {pinnedNotes.map((note) => (
            <Link
              key={note.id}
              to={`/notes/$`}
              params={{ _splat: note.id }}
              search={{ mode: "read", query: undefined }}
              className="focus-ring flex h-8 items-center gap-3 rounded px-2 hover:bg-bg-secondary active:bg-bg-tertiary"
            >
              <NoteFavicon note={note} />
              {note.displayName}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function NavLink({
  className,
  activeIcon,
  inactiveIcon,
  children,
  ...props
}: LinkComponentProps<"a"> & {
  activeIcon: React.ReactNode
  inactiveIcon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      activeOptions={{ exact: true }}
      className={cx(
        "focus-ring flex h-8 items-center gap-3 rounded px-2 hover:bg-bg-secondary active:bg-bg-tertiary aria-[current]:font-semibold",
        className,
      )}
      {...props}
    >
      <span className="hidden [[aria-current=page]>&]:flex">{activeIcon}</span>
      <span className="flex text-text-secondary [[aria-current=page]>&]:hidden">
        {inactiveIcon}
      </span>
      {children}
    </Link>
  )
}
