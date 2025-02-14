import { useNavigate, useRouter } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { useHotkeys } from "react-hotkeys-hook"
import { sidebarAtom } from "../global-state"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { ArrowLeftIcon16, ArrowRightIcon16, PlusIcon16, SidebarIcon16 } from "./icons"
import { VoiceModeButton } from "./voice-mode"

export type AppHeaderProps = {
  title: React.ReactNode
  icon?: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function AppHeader({ title, icon, className, actions }: AppHeaderProps) {
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
          view: "grid",
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
      <header className="flex h-10 items-center gap-2 px-2 coarse:h-14">
        <div className="hidden items-center empty:hidden sm:flex">
          {sidebar === "collapsed" ? (
            <>
              <IconButton
                aria-label="Expand sidebar"
                size="small"
                onClick={() => setSidebar("expanded")}
              >
                <SidebarIcon16 />
              </IconButton>
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
                      view: "grid",
                    },
                  })
                }}
              >
                <PlusIcon16 />
              </IconButton>
              <div role="separator" className="mx-2 h-5 w-px bg-border-secondary" />
            </>
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
        <div className="flex w-0 flex-grow items-center gap-3 px-2">
          {icon ? (
            <div className="flex size-icon flex-shrink-0 text-text-secondary">{icon}</div>
          ) : null}
          <div className="truncate font-content font-bold">{title}</div>
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          {actions ? (
            <>
              <div className="flex items-center">{actions}</div>
              <div role="separator" className="h-5 w-px bg-border-secondary" />
            </>
          ) : null}
          <VoiceModeButton />
        </div>
      </header>
    </div>
  )
}
