import { useNavigate, useRouter } from "@tanstack/react-router"
import { useSetAtom } from "jotai"
import { forwardRef, useState } from "react"
import { Drawer } from "vaul"
import { globalStateMachineAtom } from "../global-state"
import { cx } from "../utils/cx"
import { generateNoteId } from "../utils/note-id"
import { isCommandMenuOpenAtom } from "./command-menu"
import { IconButton, IconButtonProps } from "./icon-button"
import { ArrowLeftIcon16, ArrowRightIcon16, MenuIcon16, ComposeIcon16, SearchIcon16 } from "./icons"
import { NavItems } from "./nav-items"
import { SyncStatusIcon, useSyncStatusText } from "./sync-status"

export function NavBar() {
  const router = useRouter()
  const navigate = useNavigate()
  const setIsCommandMenuOpen = useSetAtom(isCommandMenuOpenAtom)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const syncText = useSyncStatusText()
  const send = useSetAtom(globalStateMachineAtom)

  return (
    <div className="border-t border-border-secondary">
      <div className="flex h-[var(--height-nav-bar)] items-stretch  p-2 [&>button]:h-full">
        <Drawer.Root
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          shouldScaleBackground={false}
        >
          <Drawer.Trigger asChild>
            <NavButton aria-label="Open navigation menu">
              <MenuIcon16 />
            </NavButton>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-gradient-to-t from-[#000000] to-[#00000000] epaper:bg-none" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 flex h-[80%] flex-col bg-bg-overlay epaper:ring-2 epaper:ring-border rounded-t-[calc(var(--border-radius-base)+12px)] outline-none">
              <div className="grid flex-1 scroll-py-2 grid-rows-[auto_1fr] overflow-y-auto p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
                <Drawer.Title className="sr-only">Navigation</Drawer.Title>
                <NavItems size="large" onNavigate={() => setIsDrawerOpen(false)} />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
        <NavButton aria-label="Go back" onClick={() => router.history.back()}>
          <ArrowLeftIcon16 />
        </NavButton>
        <NavButton aria-label="Go forward" onClick={() => router.history.forward()}>
          <ArrowRightIcon16 />
        </NavButton>
        <NavButton aria-label="Open command menu" onClick={() => setIsCommandMenuOpen(true)}>
          <SearchIcon16 />
        </NavButton>
        {syncText ? (
          <NavButton aria-label={typeof syncText === "string" ? syncText : "Sync"} onClick={() => send({ type: "SYNC" })}>
            <SyncStatusIcon />
          </NavButton>
        ) : null}
        <NavButton
          aria-label="New note"
          shortcut={["⌘", "⇧", "O"]}
          onClick={() =>
            navigate({
              to: "/notes/$",
              params: { _splat: generateNoteId() },
              search: {
                mode: "write",
                query: undefined,
                view: "grid",
              },
            })
          }
        >
          <ComposeIcon16 />
        </NavButton>
      </div>
    </div>
  )
}

const NavButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ className, ...props }, ref) => {
  return (
    <IconButton
      ref={ref}
      size="small"
      disableTooltip
      className={cx("w-full!", className)}
      {...props}
    />
  )
})

NavButton.displayName = "NavButton"
