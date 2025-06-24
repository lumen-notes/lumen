import "@fontsource-variable/literata/wght-italic.css"
import "@fontsource-variable/literata/wght.css"
import "@fontsource-variable/shantell-sans/full.css"
import "@fontsource-variable/shantell-sans/full-italic.css"
import { Tooltip } from "@base-ui-components/react/tooltip"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import "@total-typescript/ts-reset"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { routeTree } from "./routeTree.gen"
import "./styles/index.css"

// Create a new router instance
const router = createRouter({ routeTree, scrollRestoration: true })

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById("root")!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <Tooltip.Provider>
        <RouterProvider router={router} />
      </Tooltip.Provider>
    </StrictMode>,
  )
}
