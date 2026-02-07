import { Link, LinkComponentProps, useLocation } from "@tanstack/react-router"
import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { createContext, useContext } from "react"
import { useNetworkState } from "react-use"
import { useRegisterSW } from "virtual:pwa-register/react"
import { globalStateMachineAtom, notesAtom, pinnedNotesAtom } from "../global-state"
import { cx } from "../utils/cx"
import { isValidDateString, isValidWeekString, toDateString } from "../utils/date"
import { HelpPanelToggle } from "./help-panel"
import { Keys } from "./keys"
import {
  CalendarDateFillIcon16,
  CalendarDateIcon16,
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

const SizeContext = createContext<"medium" | "large">("medium")

export function NavItems({
  size = "medium",
  onNavigate,
}: {
  size?: "medium" | "large"
  onNavigate?: () => void
}) {
  const pinnedNotes = useAtomValue(pinnedNotesAtom)
  const hasDailyNote = useAtomValue(hasDailyNoteAtom)
  const syncText = useSyncStatusText()
  const send = useSetAtom(globalStateMachineAtom)
  const { online } = useNetworkState()
  const { pathname } = useLocation()

  const today = new Date()
  const todayString = toDateString(today)

  // Calendar link is active when viewing any daily or weekly note
  const noteId = pathname.startsWith("/notes/") ? pathname.slice(7) : ""
  const isCalendarActive = isValidDateString(noteId) || isValidWeekString(noteId)

  // Reference: https://vite-pwa-org.netlify.app/frameworks/react.html#prompt-for-update
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log("SW registered: " + registration)

      if (registration) {
        // Check for updates every hour
        setInterval(
          () => {
            registration.update()
          },
          60 * 60 * 1000,
        )
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error)
    },
  })

  return (
    <SizeContext.Provider value={size}>
      <div className="flex grow flex-col justify-between gap-6">
        <div className="flex flex-col gap-2">
          <ul className="flex flex-col gap-1">
            <li>
              <NavLink
                to="/"
                search={{ query: undefined, view: "grid" }}
                activeIcon={<NoteFillIcon16 />}
                icon={<NoteIcon16 />}
                onNavigate={onNavigate}
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
                forceActive={isCalendarActive}
                onNavigate={onNavigate}
              >
                Calendar
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/tags"
                search={{ query: undefined, sort: "name", view: "list" }}
                activeIcon={<TagFillIcon16 />}
                icon={<TagIcon16 />}
                onNavigate={onNavigate}
              >
                Tags
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
                  <li key={note.id} className="flex">
                    <NavLink
                      key={note.id}
                      to="/notes/$"
                      params={{ _splat: note.id }}
                      search={{ mode: "read", query: undefined, view: "grid" }}
                      icon={
                        <NoteFavicon
                          note={note}
                          className="epaper:[[aria-current=page]_&]:text-bg"
                        />
                      }
                      className="w-0 flex-1"
                      onNavigate={onNavigate}
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
          {needRefresh ? (
            <button className="nav-item" data-size={size} onClick={() => updateServiceWorker(true)}>
              <div className="grid size-4 place-items-center [&>*]:row-span-full [&>*]:col-span-full">
                <div className="size-3 rounded-full bg-border-focus opacity-50 animate-ping" />
                <div className="size-2 rounded-full bg-border-focus" />
              </div>
              Update Lumen
            </button>
          ) : null}
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
          <NavLink
            to="/settings"
            search={{ query: undefined }}
            activeIcon={<SettingsFillIcon16 />}
            icon={<SettingsIcon16 />}
            className="text-text-secondary"
            onNavigate={onNavigate}
          >
            Settings
          </NavLink>
          <HelpPanelToggle className="nav-item text-text-secondary" size={size} />
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
  forceActive = false,
  onNavigate,
  shortcut,
  children,
  onClick,
  ...props
}: LinkComponentProps<"a"> & {
  activeIcon?: React.ReactNode
  icon: React.ReactNode
  includeSearch?: boolean
  forceActive?: boolean
  onNavigate?: () => void
  shortcut?: string[]
  children: React.ReactNode
}) {
  const size = useContext(SizeContext)

  return (
    <Link
      activeOptions={{ exact: true, includeSearch }}
      data-size={size}
      className={cx("nav-item group", className)}
      aria-current={forceActive ? "page" : undefined}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          onNavigate?.()
        }
      }}
      {...props}
    >
      {activeIcon ? (
        <span className="hidden shrink-0 [[aria-current=page]>&]:flex">{activeIcon}</span>
      ) : null}
      <span
        className={cx(
          "flex shrink-0 text-text-secondary",
          activeIcon && "[[aria-current=page]>&]:hidden",
        )}
      >
        {icon}
      </span>
      <span className="truncate">{children}</span>
      {shortcut ? (
        <div className="ml-auto [&_*]:text-text-tertiary hidden coarse:!hidden group-hover:flex group-focus-visible:flex [[aria-current=page]>&]:flex">
          <Keys keys={shortcut} />
        </div>
      ) : null}
    </Link>
  )
}
