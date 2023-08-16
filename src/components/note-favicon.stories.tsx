import { StoryObj } from "@storybook/react"
import { Note } from "../types"
import { Card } from "./card"
import { NoteFavicon } from "./note-favicon"
import { within } from "@storybook/testing-library"
import { expect } from "@storybook/jest"

export default {
  title: "NoteFavicon",
  component: NoteFavicon,
  render: (args: { note: Note }) => (
    <Card className="mx-auto max-w-lg p-4">
      <NoteFavicon {...args} />
    </Card>
  ),
}

type Story = StoryObj<typeof NoteFavicon>

const noteStubbed: Note = {
  backlinks: [],
  dates: [],
  frontmatter: {},
  id: "1",
  links: [],
  queries: [],
  tags: [],
  rawBody: "",
  tasks: [],
  title: "",
  url: null,
}

export const Github: Story = {
  args: {
    note: {
      ...noteStubbed,
      frontmatter: {
        github: "lumen-notes",
      },
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "github-avatar"),
}

export const WithUrl: Story = {
  args: {
    note: {
      ...noteStubbed,
      url: "https://example.com",
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "note-favicon-url"),
}

export const Book: Story = {
  args: {
    note: {
      ...noteStubbed,
      frontmatter: {
        isbn: 9781542866507,
      },
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "note-favicon-book"),
}

export const Template: Story = {
  args: {
    note: {
      ...noteStubbed,
      frontmatter: {
        template: {
          name: "name-template",
        },
      },
    },
  },
  play: async ({ canvasElement }) => expectFavicon(canvasElement, "note-template-icon16"),
}

const expectFavicon = async (canvasElement: HTMLElement, favicon: string) => {
  const canvas = within(canvasElement)
  await expect(await canvas.findByTestId(favicon)).toBeTruthy()
}
