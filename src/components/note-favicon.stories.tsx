import { expect } from "@storybook/jest"
import { StoryObj } from "@storybook/react"
import { within } from "@storybook/testing-library"
import { Note } from "../schema"
import { NoteFavicon } from "./note-favicon"

export default {
  title: "NoteFavicon",
  component: NoteFavicon,
  parameters: {
    layout: "centered",
  },
}

type Story = StoryObj<typeof NoteFavicon>

const emptyNote: Note = {
  id: "1",
  content: "",
  tags: [],
  dates: [],
  frontmatter: {},
  links: [],
  title: "",
  url: null,
  openTasks: 0,
  backlinks: [],
}

export const Default: Story = {
  args: {
    note: emptyNote,
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-default"),
}

export const IsTemplate: Story = {
  args: {
    note: {
      ...emptyNote,
      frontmatter: {
        template: {
          name: "example",
        },
      },
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-template"),
}

export const IsDailyNote: Story = {
  args: {
    note: {
      ...emptyNote,
      id: "2023-07-11",
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-daily"),
}

export const IsWeeklyNote: Story = {
  args: {
    note: {
      ...emptyNote,
      id: "2023-W07",
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-weekly"),
}

export const HasIsbn: Story = {
  args: {
    note: {
      ...emptyNote,
      frontmatter: {
        isbn: 9781542866507,
      },
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-isbn"),
}

export const HasUrl: Story = {
  args: {
    note: {
      ...emptyNote,
      url: "https://google.com",
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-url"),
}

export const HasGithub: Story = {
  args: {
    note: {
      ...emptyNote,
      frontmatter: {
        github: "colebemis",
      },
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "favicon-github"),
}

const expectFavicon = async (canvasElement: HTMLElement, favicon: string) => {
  const canvas = within(canvasElement)
  await expect(await canvas.findByTestId(favicon)).toBeTruthy()
}
