import { useNavigate, useRouter } from "@tanstack/react-router"
import { useHotkeys } from "react-hotkeys-hook"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { ArrowLeftIcon16, ArrowRightIcon16, MenuIcon16, PlusIcon16 } from "./icons"
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
        "flex h-10 items-center justify-between px-2 sm:grid sm:grid-cols-3",
        className,
      )}
    >
      <div className="hidden items-center sm:flex">
        <IconButton aria-label="Menu" size="small" disableTooltip>
          <MenuIcon16 />
        </IconButton>
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
        <div className="flex items-center">
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
