import React from "react"
import * as Tooltip from "@radix-ui/react-tooltip"
import "../src/index.css"

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [
  (Story) => (
    <Tooltip.Provider>
      <Story />
    </Tooltip.Provider>
  ),
]
