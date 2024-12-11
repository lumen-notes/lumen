import * as NavMenu from "@radix-ui/react-navigation-menu"
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router"
import { useHotkeys } from "react-hotkeys-hook"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { ArrowLeftIcon16, ArrowRightIcon16, PlusIcon16, SidebarIcon16 } from "./icons"
import { SyncIconButton } from "./sync-status"

export type AppHeaderProps = {
  title: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function AppHeader({ title, className, actions }: AppHeaderProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const searchParams = useSearch({ strict: false })

  useHotkeys(
    "mod+shift+o",
    () => {
      navigate({
        to: "/notes/$",
        params: { _splat: `${Date.now()}` },
        search: {
          mode: "write",
          width: "fixed",
          query: undefined,
          sidebar: searchParams.sidebar === "collapsed" ? "collapsed" : "expanded",
        },
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
        "box-content flex h-10 items-center gap-2 px-2 xl:grid xl:grid-cols-3 coarse:h-14",
        className,
      )}
    >
      <div className="hidden items-center empty:hidden sm:flex">
        {searchParams.sidebar === "collapsed" ? (
          <IconButton
            aria-label="Expand sidebar"
            size="small"
            onClick={() => {
              navigate({
                to: ".",
                search: (prev) => ({
                  ...prev,
                  sidebar: "expanded",
                }),
                replace: true,
              })
            }}
          >
            <SidebarIcon16 />
          </IconButton>
        ) : null}
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
      <div className="col-start-2 w-0 flex-grow justify-self-center px-2 xl:w-full xl:text-center">
        {title}
      </div>
      <div className="col-start-3 flex items-center gap-2 justify-self-end">
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
                  search: {
                    mode: "write",
                    width: "fixed",
                    query: undefined,
                    sidebar: searchParams.sidebar === "collapsed" ? "collapsed" : "expanded",
                  },
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
