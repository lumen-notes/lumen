import * as NavMenu from "@radix-ui/react-navigation-menu"
import { Link, useNavigate, useRouter, useSearch } from "@tanstack/react-router"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useHotkeys } from "react-hotkeys-hook"
import { notesAtom } from "../global-state"
import { cx } from "../utils/cx"
import { toDateString, toWeekString } from "../utils/date"
import { IconButton } from "./icon-button"
import {
  ArrowLeftIcon16,
  ArrowRightIcon16,
  CalendarDateIcon16,
  CalendarIcon16,
  SidebarIcon16,
  NoteIcon16,
  PlusIcon16,
  SettingsIcon16,
  TagIcon16,
} from "./icons"
import { SyncIconButton } from "./sync-status"

export type AppHeaderProps = {
  title: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

const hasDailyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toDateString(new Date())))
const hasWeeklyNoteAtom = selectAtom(notesAtom, (notes) => notes.has(toWeekString(new Date())))

export function AppHeader({ title, className, actions }: AppHeaderProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const searchParams = useSearch({ strict: false })

  const hasDailyNote = useAtomValue(hasDailyNoteAtom)
  const hasWeeklyNote = useAtomValue(hasWeeklyNoteAtom)

  useHotkeys(
    "mod+shift+o",
    () => {
      navigate({
        to: "/notes/$",
        params: { _splat: `${Date.now()}` },
        search: { mode: "write", width: "fixed", query: undefined },
      })
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )

  return (
    <header
      className={cx(
        "flex h-10 items-center gap-2 px-2 xl:grid xl:grid-cols-3 coarse:h-14",
        className,
      )}
    >
      <div className="hidden items-center sm:flex">
        <NavMenu.Root delayDuration={100} className="relative">
          <NavMenu.List>
            <NavMenu.Item>
              <NavMenu.Trigger asChild>
                <IconButton aria-label="Menu" size="small" disableTooltip>
                  <SidebarIcon16 />
                </IconButton>
              </NavMenu.Trigger>
              <NavMenu.Content
                className={cx(
                  "card-2 absolute left-0 top-[calc(100%+4px)] z-20 min-w-[256px] rounded-lg p-1 animate-in fade-in slide-in-from-left-2",
                )}
              >
                <ul>
                  <li>
                    <NavMenuLink>
                      <Link to="/" search={{ query: undefined }}>
                        <NoteIcon16 />
                        Notes
                      </Link>
                    </NavMenuLink>
                  </li>
                  <li>
                    <NavMenuLink>
                      <Link
                        to={`/notes/$`}
                        params={{ _splat: toDateString(new Date()) }}
                        search={{
                          mode: hasDailyNote ? "read" : "write",
                          width: searchParams.width === "fill" ? "fill" : "fixed",
                          query: undefined,
                        }}
                      >
                        <CalendarDateIcon16 date={new Date().getDate()} />
                        Today
                      </Link>
                    </NavMenuLink>
                  </li>
                  <li>
                    <NavMenuLink>
                      <Link
                        to={`/notes/$`}
                        params={{ _splat: toWeekString(new Date()) }}
                        search={{
                          mode: hasWeeklyNote ? "read" : "write",
                          width: searchParams.width === "fill" ? "fill" : "fixed",
                          query: undefined,
                        }}
                      >
                        <CalendarIcon16 />
                        This week
                      </Link>
                    </NavMenuLink>
                  </li>
                  <li>
                    <NavMenuLink>
                      <Link to="/tags" search={{ query: undefined }}>
                        <TagIcon16 />
                        Tags
                      </Link>
                    </NavMenuLink>
                  </li>
                  <li>
                    <NavMenuLink>
                      <Link to="/settings">
                        <SettingsIcon16 />
                        Settings
                      </Link>
                    </NavMenuLink>
                  </li>
                </ul>
              </NavMenu.Content>
            </NavMenu.Item>
          </NavMenu.List>
        </NavMenu.Root>
        <IconButton
          aria-label="Go back"
          size="small"
          // TODO: Disable if you can't go back
          // https://stackoverflow.com/questions/3588315/how-to-check-if-the-user-can-go-back-in-browser-history-or-not
          onClick={() => router.history.back()}
          className="group"
        >
          <ArrowLeftIcon16 className="transition-transform duration-100 group-active:-translate-x-0.5" />
        </IconButton>
        <IconButton
          aria-label="Go forward"
          size="small"
          className="group"
          onClick={() => router.history.forward()}
        >
          <ArrowRightIcon16 className="transition-transform duration-100 group-active:translate-x-0.5" />
        </IconButton>
      </div>
      <div className="w-0 flex-grow justify-self-center px-2 xl:w-full xl:text-center">{title}</div>
      <div className="flex items-center gap-2 justify-self-end">
        {actions ? (
          <>
            <div className="flex items-center">{actions}</div>
            <div role="separator" className="h-5 w-px bg-border-secondary" />
          </>
        ) : null}
        <div className="flex items-center empty:hidden">
          <SyncIconButton size="small" />
          <div className="hidden sm:flex">
            <IconButton
              aria-label="New note"
              shortcut={["⌘", "⇧", "O"]}
              size="small"
              onClick={() => {
                navigate({
                  to: "/notes/$",
                  params: { _splat: `${Date.now()}` },
                  search: { mode: "write", width: "fixed", query: undefined },
                })
              }}
            >
              <PlusIcon16 />
            </IconButton>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavMenuLink({ children }: { children: React.ReactNode }) {
  return (
    <NavMenu.Link
      asChild
      className="focus-ring flex h-8 cursor-pointer select-none items-center gap-3 rounded px-3 leading-4 hover:bg-bg-secondary active:bg-bg-tertiary coarse:h-10 coarse:gap-4 coarse:px-4 [&>svg]:text-text-secondary"
    >
      {children}
    </NavMenu.Link>
  )
}
