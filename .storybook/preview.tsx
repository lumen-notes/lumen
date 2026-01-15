import { Tooltip } from "@base-ui/react/tooltip"
import React from "react"
import "../src/styles/index.css"

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
      <Tooltip.Provider>
        <Story />
      </Tooltip.Provider>
    )
  },
]
