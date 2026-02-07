import { useRouter } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { useHotkeys } from "react-hotkeys-hook"
import { isHelpPanelOpenAtom, sidebarAtom } from "../global-state"
import { useCreateNewNote } from "../hooks/create-new-note"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { ArrowLeftIcon16, ArrowRightIcon16, SidebarCollapsedIcon16 } from "./icons"
import { NewNoteButton } from "./new-note-button"

export type PageHeaderProps = {
  title: React.ReactNode
  icon?: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, icon, className, actions }: PageHeaderProps) {
  const router = useRouter()
  const [sidebar, setSidebar] = useAtom(sidebarAtom)
  const [, setHelpPanel] = useAtom(isHelpPanelOpenAtom)
  const createNewNote = useCreateNewNote()

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

  useHotkeys("mod+shift+o", createNewNote, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  })

  // Toggle help panel with Cmd/Ctrl + /
  useHotkeys(
    "mod+/",
    () => {
      setHelpPanel((prev) => !prev)
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
        {sidebar === "collapsed" ? (
          <div className="hidden items-center sm:flex">
            <IconButton
              aria-label="Show sidebar"
              shortcut={["⌘", "B"]}
              tooltipAlign="start"
              size="small"
              onClick={() => setSidebar("expanded")}
            >
              <SidebarCollapsedIcon16 />
            </IconButton>
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
            <NewNoteButton />
          </div>
        ) : null}
        {sidebar === "collapsed" && icon ? (
          <div role="separator" className="h-5 w-px bg-border hidden sm:block" />
        ) : null}
        <div className="flex w-0 grow items-center gap-3 px-2">
          {icon ? <div className="flex size-icon shrink-0 text-text-secondary">{icon}</div> : null}
          <div className="truncate">{title}</div>
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          {actions ? <div className="flex items-center">{actions}</div> : null}
        </div>
      </header>
    </div>
  )
}
