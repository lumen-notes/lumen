import { Link, LinkComponentProps } from "@tanstack/react-router"
import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { ComponentPropsWithoutRef, createContext, useContext } from "react"
import { useNetworkState } from "react-use"
import { globalStateMachineAtom, notesAtom, pinnedNotesAtom } from "../global-state"
import { cx } from "../utils/cx"
import { toDateString, toWeekString } from "../utils/date"
import { CheatsheetDialog } from "./cheatsheet-dialog"
import { Dialog } from "./dialog"
import {
  BookIcon16,
  CalendarDateFillIcon16,
  CalendarDateIcon16,
  CalendarFillIcon16,
  CalendarIcon16,
  MessageIcon16,
  NoteFillIcon16,
  NoteIcon16,
  OfflineIcon16,
  SettingsFillIcon16,
  SettingsIcon16,
  TagFillIcon16,
  TagIcon16,
} from "./icons"
import { NoteFavicon } from "./note-favicon"
import { SyncStatusIcon, useSyncStatusText } from "./sync-status"

const hasDailyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toDateString(new Date())))
const hasWeeklyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toWeekString(new Date())))

const SizeContext = createContext<"medium" | "large">("medium")

export function NavItems({ size = "medium" }: { size?: "medium" | "large" }) {
  const pinnedNotes = useAtomValue(pinnedNotesAtom)
  const hasDailyNote = useAtomValue(hasDailyNoteAtom)
  const hasWeeklyNote = useAtomValue(hasWeeklyNoteAtom)
  const syncText = useSyncStatusText()
  const send = useSetAtom(globalStateMachineAtom)
  const { online } = useNetworkState()

  const today = new Date()
  const todayString = toDateString(today)
  const weekString = toWeekString(today)

  return (
    <SizeContext.Provider value={size}>
      <div className="flex flex-grow flex-col justify-between gap-6">
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
                Pinned notes
              </div>
              <ul className="flex flex-col gap-1">
                {pinnedNotes.map((note) => (
                  <li key={note.id} className="flex">
                    <NavLink
                      key={note.id}
                      to={`/notes/$`}
                      params={{ _splat: note.id }}
                      search={{ mode: "read", query: undefined, view: "grid" }}
                      icon={
                        <NoteFavicon note={note} className="eink:[[aria-current=page]_&]:text-bg" />
                      }
                      className="w-0 flex-1"
                    >
                      {note.displayName}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          {!online ? (
            <div className="nav-item text-text-secondary" data-size={size}>
              <OfflineIcon16 />
              Offline
            </div>
          ) : null}
          {syncText ? (
            <button
              className="nav-item text-text-secondary"
              data-size={size}
              onClick={() => send({ type: "SYNC" })}
            >
              <SyncStatusIcon />
              {syncText}
            </button>
          ) : null}
          <Dialog>
            <Dialog.Trigger className="nav-item text-text-secondary" data-size={size}>
              <BookIcon16 />
              Cheatsheet
            </Dialog.Trigger>
            <CheatsheetDialog />
          </Dialog>
          <ExternalLink
            href="https://github.com/lumen-notes/lumen/issues/new"
            icon={<MessageIcon16 />}
          >
            Send feedback
          </ExternalLink>
        </div>
      </div>
    </SizeContext.Provider>
  )
}

function NavLink({
  className,
  activeIcon,
  icon,
  includeSearch = false,
  children,
  ...props
}: LinkComponentProps<"a"> & {
  activeIcon?: React.ReactNode
  icon: React.ReactNode
  includeSearch?: boolean
  children: React.ReactNode
}) {
  const size = useContext(SizeContext)

  return (
    <Link
      activeOptions={{ exact: true, includeSearch }}
      data-size={size}
      className={cx("nav-item", className)}
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

function ExternalLink({
  className,
  icon,
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  icon: React.ReactNode
}) {
  const size = useContext(SizeContext)

  return (
    <a
      className={cx("nav-item text-text-secondary", className)}
      data-size={size}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      <span className="flex flex-shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </a>
  )
}
