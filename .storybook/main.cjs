const path = require("path")
module.exports = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    { name: "@storybook/addon-essentials", options: { backgrounds: false } },
    "@storybook/addon-links",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    docsPage: true,
  },
}
