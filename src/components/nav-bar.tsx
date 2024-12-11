import { useNavigate, useRouter } from "@tanstack/react-router"
import { ComponentPropsWithoutRef, forwardRef } from "react"
import { Drawer } from "vaul"
import { ArrowLeftIcon24, ArrowRightIcon24, MenuIcon24, PlusIcon24 } from "./icons"
import { NavItems } from "./nav-items"

export function NavBar() {
  const router = useRouter()
  const navigate = useNavigate()

  return (
    <div className="flex border-t border-border-secondary p-2">
      <Drawer.Root shouldScaleBackground>
        <Drawer.Trigger asChild>
          <NavButton aria-label="Open menu">
            <MenuIcon24 />
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
        <ArrowLeftIcon24 />
      </NavButton>
      <NavButton aria-label="Go forward" onClick={() => router.history.forward()}>
        <ArrowRightIcon24 />
      </NavButton>
      <NavButton
        aria-label="New note"
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
        <PlusIcon24 />
      </NavButton>
    </div>
  )
}

const NavButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
  (props, ref) => {
    return (
      <button
        {...props}
        ref={ref}
        className="focus-ring grid h-10 w-full place-items-center rounded text-text-secondary hover:bg-bg-secondary active:bg-bg-tertiary"
      />
    )
  },
)
NavButton.displayName = "NavButton"
