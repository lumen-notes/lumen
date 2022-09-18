import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { useActor } from "@xstate/react"
import clsx from "clsx"
import React from "react"
import { NavLink as RouterNavLink, NavLinkProps, Outlet } from "react-router-dom"
import { GlobalStateContext } from "../global-state"
import { toDateString } from "../utils/date"
import { Button, IconButton } from "./button"
import { Card } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import {
  CalendarFillIcon24,
  CalendarIcon24,
  LoadingIcon16,
  MoreIcon24,
  NoteFillIcon24,
  NoteIcon24,
  TagFillIcon24,
  TagIcon24,
} from "./icons"

export function Root() {
  const globalState = React.useContext(GlobalStateContext)
  const [state, send] = useActor(globalState.service)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Reload with `command + r`
      if (event.key === "r" && event.metaKey && !event.shiftKey) {
        send("RELOAD")
        event.preventDefault()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [send])

  if (state.matches("loadingContext")) {
    return null
  }

  if (state.matches("notSupported")) {
    return (
      <div className="p-4">
        <p>
          This browser is not supported. Please open Lumen in a browser that supports the{" "}
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API#browser_compatibility"
            className="underline underline-offset-2"
          >
            File System Access API
          </a>
          .
        </p>
      </div>
    )
  }

  if (!state.context.directoryHandle) {
    return (
      <div className="grid h-screen place-items-center p-4 [@supports(height:100svh)]:h-[100svh]">
        <Button onClick={() => send("SHOW_DIRECTORY_PICKER")}>Connect a local folder</Button>
      </div>
    )
  }

  return (
    <div>
      {state.matches("prompt") ? (
        <AlertDialog.Root
          open
          onOpenChange={(open) => {
            if (!open) {
              send("PERMISSION_DENIED")
            }
          }}
        >
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-10 bg-bg-backdrop" />
            <AlertDialog.Content asChild>
              <Card
                elevation={2}
                className="fixed top-1/2 left-1/2 z-10 flex w-[90vw] max-w-xs -translate-x-1/2 -translate-y-1/2 flex-col gap-4 p-4"
              >
                <div className="flex flex-col gap-2">
                  <AlertDialog.Title className="text-base font-semibold leading-none">
                    Allow access to {state.context.directoryHandle.name}?
                  </AlertDialog.Title>
                  <AlertDialog.Description className="text-text-muted">
                    Lumen needs permission to access your local {state.context.directoryHandle.name}{" "}
                    folder
                  </AlertDialog.Description>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <AlertDialog.Cancel asChild>
                    <Button>Deny</Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <Button
                      variant="primary"
                      onClick={() => send("REQUEST_PERMISSION")}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                    >
                      Allow
                    </Button>
                  </AlertDialog.Action>
                </div>
              </Card>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ) : null}
      <div className="flex h-screen">
        <div className="flex flex-col items-center justify-between border-r border-border-divider p-2">
          <nav>
            <ul className="flex flex-col gap-2">
              <li>
                <NavLink to="/" aria-label="Notes" end>
                  {({ isActive }) => (isActive ? <NoteFillIcon24 /> : <NoteIcon24 />)}
                </NavLink>
              </li>
              <li>
                <NavLink to={`/dates/${toDateString(new Date())}`} aria-label="Today" end>
                  {({ isActive }) =>
                    isActive ? (
                      <CalendarFillIcon24 date={new Date().getDate()} />
                    ) : (
                      <CalendarIcon24 date={new Date().getDate()} />
                    )
                  }
                </NavLink>
              </li>
              <li>
                <NavLink to="/tags" aria-label="Tags" end>
                  {({ isActive }) => (isActive ? <TagFillIcon24 /> : <TagIcon24 />)}
                </NavLink>
              </li>
            </ul>
          </nav>
          <div className="flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton aria-label="More actions">
                  <MoreIcon24 />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content side="right" align="end">
                <DropdownMenu.Item onClick={() => send("RELOAD")} shortcut="⌘R">
                  Reload
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => send("DISCONNECT")}>Disconnect</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </div>
        <main className="flex-shrink flex-grow overflow-auto">
          <Outlet />
        </main>
      </div>
      {state.matches("loadingNotes") ? (
        <Card
          elevation={1}
          className="fixed bottom-2 right-2 p-2 text-text-muted"
          role="status"
          aria-label="Loading notes"
        >
          <LoadingIcon16 />
        </Card>
      ) : null}
    </div>
  )
}

function NavLink(props: NavLinkProps) {
  return (
    <RouterNavLink
      className={({ isActive }) =>
        clsx("flex rounded py-2 px-2 hover:bg-bg-hover", isActive ? "text-text" : "text-text-muted")
      }
      {...props}
    />
  )
}
