import { Outlet } from "react-router-dom"
import { useMedia } from "react-use"
import { useIsFullscreen } from "../utils/use-is-fullscreen"
import { NavBar } from "./nav-bar"

/** Renders a navigation bar when not in fullscreen mode. */
export function NavLayout() {
  // We consider any viewport wider than 640px a desktop viewport.
  // This breakpoint is copied from Tailwind's default breakpoints.
  // Reference: https://tailwindcss.com/docs/responsive-design
  const isDesktop = useMedia("(min-width: 640px)")

  const isFullscreen = useIsFullscreen()

  return (
    <div className="flex h-[0%] w-full flex-grow flex-col-reverse sm:flex-row">
      {!isFullscreen ? (
        <div className="flex">
          <NavBar position={isDesktop ? "left" : "bottom"} />
        </div>
      ) : null}
      <main className="w-full flex-grow overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
