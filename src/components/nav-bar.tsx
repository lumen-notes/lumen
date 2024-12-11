import { ComponentPropsWithoutRef } from "react"
import { useRouter, useNavigate } from "@tanstack/react-router"
import { ArrowLeftIcon24, ArrowRightIcon24, MenuIcon24, PlusIcon24 } from "./icons"

export function NavBar() {
  const router = useRouter()
  const navigate = useNavigate()
  return (
    <div className="flex border-t border-border-secondary p-2">
      <NavButton aria-label="Open menu">
        <MenuIcon24 />
      </NavButton>
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
            },
          })
        }
      >
        <PlusIcon24 />
      </NavButton>
    </div>
  )
}

function NavButton(props: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      className="focus-ring grid h-10 w-full place-items-center rounded text-text-secondary hover:bg-bg-secondary active:bg-bg-tertiary"
    />
  )
}
