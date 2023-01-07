import { useActor } from "@xstate/react"
import React from "react"
import { Outlet } from "react-router-dom"
import { GlobalStateContext } from "../global-state"
// import { Button } from "./button"
import { Card } from "./card"
import { LoadingIcon16 } from "./icons"
import { NavBar } from "./nav-bar"
import { useMedia } from "react-use"

export function Root() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  // We consider any viewport wider than 640px a desktop viewport.
  // This breakpoint is copied from Tailwind's default breakpoints.
  // Reference: https://tailwindcss.com/docs/responsive-design
  const isDesktop = useMedia("(min-width: 640px)")

  if (state.matches("loadingContext")) {
    return null
  }

  // if (state.matches("notSupported")) {
  //   return (
  //     <div className="p-4">
  //       <p>
  //         This browser is not supported. Please open Lumen in a browser that supports the{" "}
  //         <a
  //           href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API#browser_compatibility"
  //           className="link"
  //         >
  //           File System Access API
  //         </a>
  //         .
  //       </p>
  //     </div>
  //   )
  // }

  // if (!state.context.directoryHandle) {
  //   return (
  //     <div className="grid h-screen place-items-center p-4 [@supports(height:100svh)]:h-[100svh]">
  //       <Button onClick={() => send("SHOW_DIRECTORY_PICKER")}>Connect a local folder</Button>
  //     </div>
  //   )
  // }

  return (
    <div>
      <div
        className="flex h-screen w-screen flex-col-reverse sm:flex-row"
        style={{ height: "100svh" }}
      >
        <div className="flex">
          <NavBar position={isDesktop ? "left" : "bottom"} />
        </div>
        <main className="w-full flex-grow overflow-auto">
          <Outlet />
        </main>
      </div>
      {state.matches("connected.loadingNotes") ? (
        <div className="fixed bottom-2 right-2">
          <Card
            elevation={1}
            className="p-2 text-text-secondary"
            role="status"
            aria-label="Loading notes"
          >
            <LoadingIcon16 />
          </Card>
        </div>
      ) : null}
    </div>
  )
}
