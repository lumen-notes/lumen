import { Link, LinkComponentProps } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { createContext, useContext } from "react"
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

const SizeContext = createContext<"medium" | "large">("medium")

export function NavItems({ size = "medium" }: { size?: "medium" | "large" }) {
  const pinnedNotes = useAtomValue(pinnedNotesAtom)
  const hasDailyNote = useAtomValue(hasDailyNoteAtom)
  const hasWeeklyNote = useAtomValue(hasWeeklyNoteAtom)

  const today = new Date()
  const todayString = toDateString(today)
  const weekString = toWeekString(today)

  return (
    <SizeContext.Provider value={size}>
      <div className="flex flex-col gap-2">
        <ul className="flex flex-col gap-1">
          <li>
            <NavLink
              to="/"
              search={{ query: undefined, view: "grid" }}
              activeIcon={<NoteFillIcon16 />}
              icon={<NoteIcon16 />}
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
                view: "grid",
              }}
              activeIcon={<CalendarDateFillIcon16 date={today.getDate()} />}
              icon={<CalendarDateIcon16 date={today.getDate()} />}
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
                view: "grid",
              }}
              activeIcon={<CalendarFillIcon16 />}
              icon={<CalendarIcon16 />}
            >
              This week
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/tags"
              search={{ query: undefined }}
              activeIcon={<TagFillIcon16 />}
              icon={<TagIcon16 />}
            >
              Tags
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              search={{ query: undefined }}
              activeIcon={<SettingsFillIcon16 />}
              icon={<SettingsIcon16 />}
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
                  <NavLink
                    key={note.id}
                    to={`/notes/$`}
                    params={{ _splat: note.id }}
                    search={{ mode: "read", query: undefined, view: "grid" }}
                    icon={<NoteFavicon noteId={note.id} content={note.content} />}
                  >
                    {note.displayName}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </SizeContext.Provider>
  )
}

function NavLink({
  className,
  activeIcon,
  icon,
  children,
  ...props
}: LinkComponentProps<"a"> & {
  activeIcon?: React.ReactNode
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const size = useContext(SizeContext)

  return (
    <Link
      activeOptions={{ exact: true, includeSearch: false }}
      className={cx(
        "focus-ring flex items-center rounded hover:bg-bg-secondary active:bg-bg-tertiary aria-[current]:bg-bg-secondary aria-[current]:font-semibold",
        size === "large" ? "h-10 gap-4 px-3" : "h-8 gap-3 px-2",
        className,
      )}
      {...props}
    >
      {activeIcon ? (
        <span className="hidden flex-shrink-0 [[aria-current=page]>&]:flex">{activeIcon}</span>
      ) : null}
      <span
        className={cx(
          "flex flex-shrink-0 text-text-secondary",
          activeIcon && "[[aria-current=page]>&]:hidden",
        )}
      >
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  )
}
