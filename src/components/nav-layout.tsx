import { Outlet } from "react-router-dom"
import { useMedia } from "react-use"
import { useRegisterSW } from "virtual:pwa-register/react"
import { Button } from "./button"
import { Card } from "./card"
import { NavBar } from "./nav-bar"

/** Renders a navigation bar when not in fullscreen mode. */
export function NavLayout() {
  // We consider any viewport wider than 640px a desktop viewport.
  // This breakpoint is copied from Tailwind's default breakpoints.
  // Reference: https://tailwindcss.com/docs/responsive-design
  const isDesktop = useMedia("(min-width: 640px)")

  // Reference: https://vite-pwa-org.netlify.app/frameworks/react.html#prompt-for-update
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log("SW registered: " + registration)

      if (registration) {
        // Check for updates every hour
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error)
    },
  })

  return (
    <div className="flex h-[0%] w-full flex-grow flex-col-reverse sm:flex-row">
      <div className="flex">
        <NavBar position={isDesktop ? "left" : "bottom"} />
      </div>
      <main className="relative w-full flex-grow overflow-auto">
        {needRefresh ? (
          <Card
            elevation={2}
            className=" absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between gap-4 p-2 pl-4 sm:left-[unset]"
          >
            <div className="flex items-center gap-3">
              {/* Dot to draw attention */}
              <div aria-hidden className="h-2 w-2 rounded-full bg-border-focus" />
              New version available
            </div>
            <Button onClick={() => updateServiceWorker(true)}>Update</Button>
          </Card>
        ) : null}
        <Outlet />
      </main>
    </div>
  )
}
