import { Link, Outlet, createRootRoute } from "@tanstack/react-router"

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
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
  return <Outlet />
}
