import { useNavigate, useRouter } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { useHotkeys } from "react-hotkeys-hook"
import { sidebarAtom } from "../global-state"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { ArrowLeftIcon16, ArrowRightIcon16, SidebarCollapsedIcon16 } from "./icons"
import { NewNoteButton } from "./new-note-button"

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

  // Toggle sidebar with Cmd/Ctrl + B
  useHotkeys(
    "mod+b",
    () => {
      setSidebar((prev) => (prev === "expanded" ? "collapsed" : "expanded"))
    },
    {
      preventDefault: true,
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )

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
      <header className="flex h-[var(--height-app-header)] items-center gap-2 px-2">
        <div className="hidden items-center empty:hidden sm:flex">
          {sidebar === "collapsed" ? (
            <>
              <IconButton
                aria-label="Expand sidebar"
                shortcut={["⌘", "B"]}
                tooltipAlign="start"
                size="small"
                onClick={() => setSidebar("expanded")}
              >
                <SidebarCollapsedIcon16 />
              </IconButton>
              <NewNoteButton />
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
          <div className="truncate font-bold">{title}</div>
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          {actions ? <div className="flex items-center">{actions}</div> : null}
        </div>
      </header>
    </div>
  )
}
