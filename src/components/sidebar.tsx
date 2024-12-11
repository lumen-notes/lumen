import { Link, LinkComponentProps } from "@tanstack/react-router"
import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { notesAtom, sidebarAtom } from "../global-state"
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

const hasDailyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toDateString(new Date())))
const hasWeeklyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toWeekString(new Date())))

export function Sidebar() {
  const hasDailyNote = useAtomValue(hasDailyNoteAtom)
  const hasWeeklyNote = useAtomValue(hasWeeklyNoteAtom)
  const setSidebar = useSetAtom(sidebarAtom)

  const today = new Date()
  const todayString = toDateString(today)
  const weekString = toWeekString(today)

  return (
    <div className="flex w-56 flex-shrink-0 flex-col gap-2 border-r border-border-secondary p-2">
      <IconButton
        aria-label="Collapse sidebar"
        tooltipSide="right"
        size="small"
        onClick={() => setSidebar("collapsed")}
      >
        <SidebarFillIcon16 />
      </IconButton>
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
      activeProps={{ "aria-current": "page" }}
      className={cx(
        "flex h-8 items-center gap-3 rounded px-2 hover:bg-bg-secondary active:bg-bg-tertiary aria-[current]:font-semibold",
        className,
      )}
      {...props}
    >
      <span className="hidden [[aria-current=page]>&]:flex">{activeIcon}</span>
      <span className="flex [[aria-current=page]>&]:hidden">{inactiveIcon}</span>
      {children}
    </Link>
  )
}
