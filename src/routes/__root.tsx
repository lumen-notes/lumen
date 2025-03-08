import { HeadContent, Link, Outlet, createRootRoute } from "@tanstack/react-router"
import { useThemeColor } from "../hooks/theme-color"
import { createPortal } from "react-dom"

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  head: () => ({
    meta: [{ title: "Lumen" }],
  }),
})

function NotFoundComponent() {
  return (
    <div className="p-4">
      Page not found.{" "}
      <Link to="/" search={{ query: undefined, view: "grid" }} className="link">
        Go home
      </Link>
    </div>
  )
}

function RootComponent() {
  useThemeColor()

  return (
    <>
      {createPortal(<HeadContent />, document.querySelector("head")!)}
      <Outlet />
    </>
  )
}
