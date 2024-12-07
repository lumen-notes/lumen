import * as NavMenu from "@radix-ui/react-navigation-menu"
import { Link, useNavigate, useRouter } from "@tanstack/react-router"
import { useHotkeys } from "react-hotkeys-hook"
import { cx } from "../utils/cx"
import { toDateString } from "../utils/date"
import { IconButton } from "./icon-button"
import {
  ArrowLeftIcon16,
  ArrowRightIcon16,
  CalendarIcon16,
  MenuIcon16,
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

export function AppHeader({ title, className, actions }: AppHeaderProps) {
  const router = useRouter()
  const navigate = useNavigate()

  useHotkeys(
    "mod+shift+o",
    (event) => {
      navigate({ to: "/notes/$", params: { _splat: `${Date.now()}` } })
      event.preventDefault()
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )

  return (
    <header
      className={cx(
        "flex h-10 items-center justify-between px-2 sm:grid sm:grid-cols-3 coarse:h-14",
        className,
      )}
    >
      <div className="hidden items-center sm:flex">
        <NavMenu.Root delayDuration={100} className="relative">
          <NavMenu.List>
            <NavMenu.Item>
              <NavMenu.Trigger asChild>
                <IconButton aria-label="Menu" size="small" disableTooltip>
                  <MenuIcon16 />
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
                      <Link to="/">
                        <NoteIcon16 />
                        Notes
                      </Link>
                    </NavMenuLink>
                  </li>
                  <li>
                    <NavMenuLink>
                      <Link to={`/notes/$`} params={{ _splat: toDateString(new Date()) }}>
                        <CalendarIcon16>{new Date().getDate()}</CalendarIcon16>
                        Calendar
                      </Link>
                    </NavMenuLink>
                  </li>
                  <li>
                    <NavMenuLink>
                      <Link to="/tags">
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
      <div className="justify-self-center whitespace-nowrap px-2">{title}</div>
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
                navigate({ to: "/notes/$", params: { _splat: `${Date.now()}` } })
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
