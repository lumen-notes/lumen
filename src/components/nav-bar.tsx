import { IconButton, IconButtonProps } from "./icon-button"

import { useNavigate, useRouter } from "@tanstack/react-router"
import { ComponentPropsWithoutRef, forwardRef } from "react"
import { Drawer } from "vaul"
import { ArrowLeftIcon16, ArrowRightIcon16, MenuIcon16, PlusIcon16 } from "./icons"
import { NavItems } from "./nav-items"
import { cx } from "../utils/cx"

export function NavBar() {
  const router = useRouter()
  const navigate = useNavigate()

  return (
    <div className="flex border-t border-border-secondary p-2">
      <Drawer.Root shouldScaleBackground>
        <Drawer.Trigger asChild>
          <NavButton aria-label="Open menu">
            <MenuIcon16 />
          </NavButton>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-[#00000066]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 flex h-[80%] flex-col rounded-t-xl bg-bg-overlay">
            <div className="flex-1 scroll-py-2 overflow-y-auto p-2">
              <div
                aria-hidden
                className="mx-auto mb-2 h-1 w-12 flex-shrink-0 rounded-full bg-border"
              />
              <Drawer.Title className="sr-only">Navigation</Drawer.Title>
              <NavItems size="large" />
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
      <NavButton
        aria-label="New note"
        shortcut={["⌘", "⇧", "O"]}
        onClick={() =>
          navigate({
            to: "/notes/$",
            params: { _splat: `${Date.now()}` },
            search: {
              mode: "write",
              query: undefined,
              view: "grid",
            },
          })
        }
      >
        <PlusIcon16 />
      </NavButton>
    </div>
  )
}

const NavButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ className, ...props }, ref) => {
  return (
    <IconButton
      ref={ref}
      size="small"
      tooltipSide="top"
      className={cx("!w-full", className)}
      {...props}
    />
  )
})

NavButton.displayName = "NavButton"
