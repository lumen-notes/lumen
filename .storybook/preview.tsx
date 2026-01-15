import { Tooltip } from "@base-ui/react/tooltip"
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"
import React from "react"
import "../src/styles/index.css"

// Create a minimal router for Storybook
const rootRoute = createRootRoute()
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => null,
})
const routeTree = rootRoute.addChildren([indexRoute])
const memoryHistory = createMemoryHistory({ initialEntries: ["/"] })
const storybookRouter = createRouter({ routeTree, history: memoryHistory })

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const globalTypes = {
  theme: {
    toolbar: {
      icon: "mirror",
      items: ["default", "eink"],
      dynamicTitle: true,
    },
  },
}

export const initialGlobals = {
  theme: "default",
}

export const decorators = [
  (Story, context) => {
    React.useEffect(() => {
      document.documentElement.setAttribute("data-theme", context.globals.theme || "default")
    }, [context.globals.theme])

    return (
      <RouterProvider router={storybookRouter}>
        <Tooltip.Provider>
          <Story />
        </Tooltip.Provider>
      </RouterProvider>
    )
  },
]
