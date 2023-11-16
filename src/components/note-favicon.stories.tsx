import { expect } from "@storybook/jest"
import { StoryObj } from "@storybook/react"
import { within } from "@storybook/testing-library"
import { Note } from "../types"
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
  queries: [],
  tasks: [],
  title: "",
  url: null,
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
