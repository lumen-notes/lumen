import { Link, LinkComponentProps } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { notesAtom, pinnedNotesAtom } from "../global-state"
import { cx } from "../utils/cx"
import { toDateString, toWeekString } from "../utils/date"
import {
  CalendarDateFillIcon16,
  CalendarDateIcon16,
  CalendarFillIcon16,
  CalendarIcon16,
  NoteFillIcon16,
  NoteIcon16,
  SettingsFillIcon16,
  SettingsIcon16,
  TagFillIcon16,
  TagIcon16,
} from "./icons"
import { NoteFavicon } from "./note-favicon"

const hasDailyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toDateString(new Date())))
const hasWeeklyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toWeekString(new Date())))

export function NavItems() {
  const pinnedNotes = useAtomValue(pinnedNotesAtom)
  const hasDailyNote = useAtomValue(hasDailyNoteAtom)
  const hasWeeklyNote = useAtomValue(hasWeeklyNoteAtom)

  const today = new Date()
  const todayString = toDateString(today)
  const weekString = toWeekString(today)

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        <li>
          <NavLink
            to="/"
            search={{ query: undefined }}
            activeIcon={<NoteFillIcon16 />}
            inactiveIcon={<NoteIcon16 />}
          >
            Notes
          </NavLink>
        </li>
        <li>
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
        </li>
        <li>
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
        </li>
        <li>
          <NavLink
            to="/tags"
            search={{ query: undefined }}
            activeIcon={<TagFillIcon16 />}
            inactiveIcon={<TagIcon16 />}
          >
            Tags
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings"
            search={{ query: undefined }}
            activeIcon={<SettingsFillIcon16 />}
            inactiveIcon={<SettingsIcon16 />}
          >
            Settings
          </NavLink>
        </li>
      </ul>
      {pinnedNotes.length > 0 ? (
        <div className="flex flex-col gap-1">
          <div className="flex h-8 items-center px-2 text-sm text-text-secondary coarse:h-10 coarse:px-3">
            Pinned
          </div>
          <ul className="flex flex-col gap-1">
            {pinnedNotes.map((note) => (
              <li key={note.id}>
                <Link
                  key={note.id}
                  to={`/notes/$`}
                  params={{ _splat: note.id }}
                  search={{ mode: "read", query: undefined }}
                  className="focus-ring flex h-8 items-center gap-3 rounded px-2 hover:bg-bg-secondary active:bg-bg-tertiary aria-[current]:bg-bg-secondary aria-[current]:font-semibold coarse:h-10 coarse:gap-4 coarse:px-3"
                >
                  <div className="flex flex-shrink-0">
                    <NoteFavicon note={note} />
                  </div>
                  <span className="truncate">{note.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
      activeOptions={{ exact: true, includeSearch: false }}
      className={cx(
        "focus-ring flex h-8 items-center gap-3 rounded px-2 hover:bg-bg-secondary active:bg-bg-tertiary aria-[current]:bg-bg-secondary aria-[current]:font-semibold",
        "coarse:h-10 coarse:gap-4 coarse:px-3",
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
