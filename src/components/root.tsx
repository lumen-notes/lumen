import { useActor } from "@xstate/react"
import clsx from "clsx"
import React from "react"
import {
  NavLink as RouterNavLink,
  NavLinkProps,
  Outlet,
} from "react-router-dom"
import { GlobalStateContext } from "../global-state"
import { Button, IconButton } from "./button"
import { Card } from "./card"
import {
  CalendarFillIcon24,
  CalendarIcon24,
  DisconnectIcon24,
  NoteFillIcon24,
  NoteIcon24,
  TagFillIcon24,
  TagIcon24,
} from "./icons"

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.623 2.543C15.643 1.073 14.082 0 12 0 9.918 0 8.357 1.072 7.377 2.543 6.427 3.969 6 5.777 6 7.5c0 2.452.689 4.725 1.894 6.721a10.733 10.733 0 0 0 2.29-2.085C9.42 10.694 9 9.123 9 7.5c0-1.277.324-2.47.873-3.293a3.55 3.55 0 0 1 .203-.276C10.568 3.328 11.196 3 12 3c.918 0 1.607.428 2.127 1.207.55.824.873 2.016.873 3.293 0 6.392-6.593 12-15 12v3c9.443 0 18-6.392 18-15 0-1.723-.426-3.53-1.377-4.957Zm.366 15.56c-.69.801-1.455 1.545-2.28 2.229C17.466 21.718 20.67 22.5 24 22.5v-3c-2.556 0-4.935-.51-7.01-1.397Z"
      />
    </svg>
  )
}

function NavLink(props: NavLinkProps) {
  return (
    <RouterNavLink
      className={({ isActive }) =>
        clsx(
          "flex rounded py-2 px-2 hover:bg-bg-hover",
          isActive ? "text-text" : "text-text-muted",
        )
      }
      {...props}
    />
  )
}

function getCurrentDateString() {
  const now = new Date()
  const year = now.getFullYear().toString().padStart(4, "0")
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const day = now.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function Root() {
  const globalState = React.useContext(GlobalStateContext)
  const [state, send] = useActor(globalState.service)

  if (state.matches("loadingContext")) {
    return null
  }

  if (!state.context.directoryHandle) {
    return (
      <div
        className="grid h-screen place-items-center p-4"
        style={{ height: "100svh" }}
      >
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <Logo />
              <h1 className="text-3xl font-medium lowercase leading-none">
                Lumen
              </h1>
            </div>
            <p className="text-base text-text-muted">
              A system for thinking, writing,
              <br />
              learning &amp; mindfulness
            </p>
          </div>
          <Button onClick={() => send("SHOW_DIRECTORY_PICKER")}>
            Connect a local folder
          </Button>
        </div>
        {import.meta.env.DEV ? <CurrentState /> : null}
      </div>
    )
  }

  return (
    <div>
      {state.matches("prompt") ? (
        <dialog open>
          <Button onClick={() => send("REQUEST_PERMISSION")}>Grant</Button>
        </dialog>
      ) : null}
      <div className="flex h-screen">
        <div className="flex flex-col items-center justify-between border-r border-border-divider p-2">
          <nav>
            <ul className="flex flex-col gap-2">
              <li>
                <NavLink to="/" aria-label="Notes" end>
                  {({ isActive }) =>
                    isActive ? <NoteFillIcon24 /> : <NoteIcon24 />
                  }
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={`/dates/${getCurrentDateString()}`}
                  aria-label="Today"
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
              <li>
                <NavLink to="/tags" aria-label="Tags" end>
                  {({ isActive }) =>
                    isActive ? <TagFillIcon24 /> : <TagIcon24 />
                  }
                </NavLink>
              </li>
            </ul>
          </nav>
          <IconButton
            aria-label="Disconnect"
            onClick={() => send("DISCONNECT")}
          >
            <DisconnectIcon24 />
          </IconButton>
        </div>
        <main className="flex-shrink flex-grow overflow-auto">
          <Outlet />
        </main>
      </div>
      {import.meta.env.DEV ? <CurrentState /> : null}
    </div>
  )
}

/** Shows the current state of the global state machine */
function CurrentState() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  return (
    <Card elevation={1} className="fixed bottom-2 right-2 px-2 py-1 font-mono">
      {JSON.stringify(state.value)}
    </Card>
  )
}
