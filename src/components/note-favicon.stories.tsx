import { expect } from "@storybook/jest"
import { StoryObj } from "@storybook/react"
import { within } from "@storybook/testing-library"
import { NoteFavicon } from "./note-favicon"
import { parseNote } from "../utils/parse-note"

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
    note: parseNote("1", ""),
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-default"),
}

export const IsTemplate: Story = {
  args: {
    note: parseNote(
      "1",
      `---
template:
  name: Example
---

# Example`,
    ),
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-template"),
}

export const IsDailyNote: Story = {
  args: {
    note: parseNote("2023-07-11", ""),
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-daily"),
}

export const IsWeeklyNote: Story = {
  args: {
    note: parseNote("2023-W07", ""),
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-weekly"),
}

export const HasIsbn: Story = {
  args: {
    note: parseNote(
      "1",
      `---
isbn: 9781542866507
---

# How to Take Smart Notes`,
    ),
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-isbn"),
}

export const HasUrl: Story = {
  args: {
    note: parseNote("1", `# [Google](https://google.com)`),
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-url"),
}

export const HasGithub: Story = {
  args: {
    note: parseNote(
      "1",
      `---
github: colebemis
---

# Cole Bemis`,
    ),
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-github"),
}

const expectFavicon = async (canvasElement: HTMLElement, favicon: string) => {
  const canvas = within(canvasElement)
  await expect(await canvas.findByTestId(favicon)).toBeTruthy()
}
