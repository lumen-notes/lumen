import { Link, useSearch, useRouter, useNavigate } from "@tanstack/react-router"
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
import { Slot } from "@radix-ui/react-slot"
import { cx } from "../utils/cx"
import { toDateString, toWeekString } from "../utils/date"
import { IconButton } from "./icon-button"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { notesAtom } from "../global-state"

const hasDailyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toDateString(new Date())))
const hasWeeklyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toWeekString(new Date())))

export function Sidebar() {
  const searchParams = useSearch({ strict: false })
  const navigate = useNavigate()

  const hasDailyNote = useAtomValue(hasDailyNoteAtom)
  const hasWeeklyNote = useAtomValue(hasWeeklyNoteAtom)

  const today = new Date()
  const todayString = toDateString(today)
  const weekString = toWeekString(today)

  return (
    <div className="flex w-56 flex-shrink-0 flex-col gap-2 border-r border-border-secondary p-2">
      <IconButton
        aria-label="Collapse sidebar"
        tooltipSide="right"
        size="small"
        onClick={() => {
          navigate({
            to: ".",
            search: (prev) => ({ ...prev, sidebar: "collapsed" }),
            replace: true,
          })
        }}
      >
        <SidebarFillIcon16 />
      </IconButton>
      <ul className="flex flex-col gap-1">
        <NavLink pathname="/">
          <Link
            to="/"
            search={{
              width: searchParams.width === "fill" ? "fill" : "fixed",
              query: undefined,
              sidebar: "expanded",
            }}
          >
            <NoteFillIcon16 data-active-icon />
            <NoteIcon16 data-inactive-icon />
            <span>Notes</span>
          </Link>
        </NavLink>
        <NavLink pathname={`/notes/${todayString}`}>
          <Link
            to="/notes/$"
            params={{ _splat: todayString }}
            search={{
              mode: hasDailyNote ? "read" : "write",
              width: searchParams.width === "fill" ? "fill" : "fixed",
              query: undefined,
              sidebar: "expanded",
            }}
          >
            <CalendarDateFillIcon16 data-active-icon date={today.getDate()} />
            <CalendarDateIcon16 data-inactive-icon date={today.getDate()} />
            <span>Today</span>
          </Link>
        </NavLink>
        <NavLink pathname={`/notes/${weekString}`}>
          <Link
            to="/notes/$"
            params={{ _splat: weekString }}
            search={{
              mode: hasWeeklyNote ? "read" : "write",
              width: searchParams.width === "fill" ? "fill" : "fixed",
              query: undefined,
              sidebar: "expanded",
            }}
          >
            <CalendarFillIcon16 data-active-icon />
            <CalendarIcon16 data-inactive-icon />
            <span>This week</span>
          </Link>
        </NavLink>
        <NavLink pathname="/tags">
          <Link
            to="/tags"
            search={{
              width: searchParams.width === "fill" ? "fill" : "fixed",
              query: undefined,
              sidebar: "expanded",
            }}
          >
            <TagFillIcon16 data-active-icon />
            <TagIcon16 data-inactive-icon />
            <span>Tags</span>
          </Link>
        </NavLink>
        <NavLink pathname="/settings">
          <Link
            to="/settings"
            search={{
              width: searchParams.width === "fill" ? "fill" : "fixed",
              sidebar: "expanded",
            }}
          >
            <SettingsFillIcon16 data-active-icon />
            <SettingsIcon16 data-inactive-icon />
            <span>Settings</span>
          </Link>
        </NavLink>
      </ul>
    </div>
  )
}

function NavLink({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const router = useRouter()
  const isActive = router.state.location.pathname === pathname
  return (
    <li>
      <Slot
        aria-current={isActive ? "page" : undefined}
        className={cx(
          "group/nav-link flex h-8 items-center gap-3 rounded px-2 transition-colors duration-100 hover:bg-bg-secondary active:bg-bg-tertiary aria-[current]:font-semibold",
          // Show inactive icon when link is not active
          "[&_[data-active-icon]]:hidden [&_[data-inactive-icon]]:block [&_[data-inactive-icon]]:text-text-secondary",
          // Show active icon when link is active
          "[&[aria-current=page]_[data-active-icon]]:block [&[aria-current=page]_[data-inactive-icon]]:hidden",
        )}
      >
        {children}
      </Slot>
    </li>
  )
}
