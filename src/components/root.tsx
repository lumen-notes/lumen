import { TooltipContentProps } from "@radix-ui/react-tooltip"
import { useActor } from "@xstate/react"
import clsx from "clsx"
import React from "react"
import {
  NavLink as RouterNavLink,
  NavLinkProps,
  Outlet,
  useMatch,
  useResolvedPath,
} from "react-router-dom"
import { GlobalStateContext } from "../global-state"
import { toDateString } from "../utils/date"
import { Button, IconButton } from "./button"
import { Card } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import {
  CalendarFillIcon24,
  CalendarIcon24,
  // GraphFillIcon24,
  // GraphIcon24,
  LoadingIcon16,
  MoreIcon24,
  NoteFillIcon24,
  NoteIcon24,
  TagFillIcon24,
  TagIcon24,
} from "./icons"

import { NewNoteDialog } from "./new-note-dialog"
import { Tooltip } from "./tooltip"

export function Root() {
  const globalState = React.useContext(GlobalStateContext)
  const [state, send] = useActor(globalState.service)

  // React.useEffect(() => {
  //   function onKeyDown(event: KeyboardEvent) {
  //     // Reload with `command + r`
  //     if (event.key === "r" && event.metaKey && !event.shiftKey) {
  //       send("RELOAD")
  //       event.preventDefault()
  //     }
  //   }

  //   window.addEventListener("keydown", onKeyDown)
  //   return () => window.removeEventListener("keydown", onKeyDown)
  // }, [send])

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
            className="link"
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
      <div className="flex h-screen w-screen flex-col-reverse sm:flex-row ">
        {/* TODO: Don't mount both desktop and mobile navigation at the same time */}
        {/* Desktop navigation */}
        <div className="hidden sm:flex">
          <NavBar direction="vertical" />
        </div>
        {/* Mobile navigation */}
        <div className="flex sm:hidden">
          <NavBar direction="horizontal" />
        </div>
        <main className="w-full flex-grow overflow-auto">
          <Outlet />
        </main>
      </div>
      {state.matches("connected.loadingNotes") ? (
        <Card
          elevation={1}
          className="fixed bottom-2 right-2 p-2 text-text-secondary"
          role="status"
          aria-label="Loading notes"
        >
          <LoadingIcon16 />
        </Card>
      ) : null}
    </div>
  )
}

function NavLink({
  tooltipSide,
  ...props
}: NavLinkProps & { tooltipSide?: TooltipContentProps["side"] }) {
  const path = useResolvedPath(props.to)
  const match = useMatch({
    path: path.pathname,
    end: props.end,
    caseSensitive: props.caseSensitive,
  })
  const isActive = match !== null

  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <RouterNavLink
          className={clsx(
            "inline-flex w-full justify-center rounded py-2 px-2 hover:bg-bg-secondary",
            isActive ? "text-text" : "text-text-secondary",
          )}
          {...props}
        />
      </Tooltip.Trigger>
      <Tooltip.Content side={tooltipSide}>{props["aria-label"]}</Tooltip.Content>
    </Tooltip>
  )
}

function NavBar({ direction }: { direction: "horizontal" | "vertical" }) {
  const globalState = React.useContext(GlobalStateContext)
  return (
    <nav
      className={clsx(
        "w-full border-border-secondary",
        direction === "vertical" ? "border-r" : "border-t",
      )}
    >
      <ul
        className={clsx(
          "flex gap-2 p-2",
          direction === "vertical" ? "h-full flex-col" : "flex-row",
        )}
      >
        <li className={clsx(direction === "vertical" ? "flex-grow-0" : "flex-grow")}>
          <NavLink
            to="/"
            aria-label="Notes"
            tooltipSide={direction === "vertical" ? "right" : "top"}
            end
          >
            {({ isActive }) => (isActive ? <NoteFillIcon24 /> : <NoteIcon24 />)}
          </NavLink>
        </li>
        <li className={clsx(direction === "vertical" ? "flex-grow-0" : "flex-grow")}>
          <NavLink
            to={`/dates/${toDateString(new Date())}`}
            aria-label="Today"
            tooltipSide={direction === "vertical" ? "right" : "top"}
            end
          >
            {({ isActive }) =>
              isActive ? (
                <CalendarFillIcon24 date={new Date().getDate()} />
              ) : (
                <CalendarIcon24 date={new Date().getDate()} />
              )
            }
          </NavLink>
        </li>
        <li className={clsx(direction === "vertical" ? "flex-grow-0" : "flex-grow")}>
          <NavLink
            to="/tags"
            aria-label="Tags"
            tooltipSide={direction === "vertical" ? "right" : "top"}
            end
          >
            {({ isActive }) => (isActive ? <TagFillIcon24 /> : <TagIcon24 />)}
          </NavLink>
        </li>
        <li className={clsx(direction === "vertical" ? "flex-grow-0" : "flex-grow")}>
          <NewNoteDialog tooltipSide={direction === "vertical" ? "right" : "top"} />
        </li>
        <li className={clsx(direction === "vertical" ? "mt-auto flex-grow-0" : "flex-grow")}>
          <DropdownMenu modal={false}>
            <DropdownMenu.Trigger asChild>
              <IconButton
                aria-label="More actions"
                tooltipSide={direction === "vertical" ? "right" : "top"}
                className="w-full"
              >
                <MoreIcon24 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content side={direction === "vertical" ? "right" : "top"} align="end">
              <DropdownMenu.Item
                onClick={() =>
                  window.open("https://github.com/colebemis/lumen/issues/new", "_blank")
                }
              >
                Send feedback
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onClick={() => globalState.service.send("RELOAD")}>
                Reload
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => globalState.service.send("DISCONNECT")}>
                Disconnect
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  )
}
