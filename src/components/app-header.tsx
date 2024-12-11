import { useNavigate, useRouter } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { useHotkeys } from "react-hotkeys-hook"
import { sidebarAtom } from "../global-state"
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
  const [sidebar, setSidebar] = useAtom(sidebarAtom)

  useHotkeys(
    "mod+shift+o",
    () => {
      navigate({
        to: "/notes/$",
        params: { _splat: `${Date.now()}` },
        search: {
          mode: "write",
          query: undefined,
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
    <div className={cx("@container/header", className)}>
      <header className="flex h-10 items-center gap-2 px-2 @6xl/header:grid @6xl/header:grid-cols-3 coarse:h-14">
        <div className="hidden items-center empty:hidden sm:flex">
          {sidebar === "collapsed" ? (
            <IconButton
              aria-label="Expand sidebar"
              size="small"
              onClick={() => setSidebar("expanded")}
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
            <ArrowLeftIcon16 className="transition-transform group-active:-translate-x-0.5" />
          </IconButton>
          <IconButton
            aria-label="Go forward"
            size="small"
            className="group"
            onClick={() => router.history.forward()}
          >
            <ArrowRightIcon16 className="transition-transform group-active:translate-x-0.5" />
          </IconButton>
        </div>
        <div className="col-start-2 w-0 flex-grow justify-self-center px-2 @6xl/header:w-full @6xl/header:text-center">
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
                      query: undefined,
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
    </div>
  )
}
