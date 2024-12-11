import { expect } from "@storybook/jest"
import { StoryObj } from "@storybook/react"
import { within } from "@storybook/testing-library"
import { NoteFavicon } from "./note-favicon"

export default {
  title: "NoteFavicon",
  component: NoteFavicon,
  parameters: {
    layout: "centered",
  },
}

type Story = StoryObj<typeof NoteFavicon>

export const Default: Story = {
  args: {
    noteId: "1",
    content: "",
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-default"),
}

export const IsTemplate: Story = {
  args: {
    noteId: "1",
    content: `---
template:
  name: example
---`,
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-template"),
}

export const IsDailyNote: Story = {
  args: {
    noteId: "2023-07-11",
    content: "",
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-daily"),
}

export const IsWeeklyNote: Story = {
  args: {
    noteId: "2023-W07",
    content: "",
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-weekly"),
}

export const HasIsbn: Story = {
  args: {
    noteId: "1",
    content: `---
isbn: 9781542866507
---`,
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-isbn"),
}

export const HasUrl: Story = {
  args: {
    noteId: "1",
    content: `# [Google](https://google.com)`,
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-url"),
}

export const HasGithub: Story = {
  args: {
    noteId: "1",
    content: `---
github: colebemis
---`,
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-github"),
}

const expectFavicon = async (canvasElement: HTMLElement, favicon: string) => {
  const canvas = within(canvasElement)
  await expect(await canvas.findByTestId(favicon)).toBeTruthy()
}
