import { StoryObj } from "@storybook/react"
import { Details } from "./details"

export default {
  title: "Details",
  component: Details,
  argTypes: {
    defaultOpen: {
      control: "boolean",
    },
  },
}

export const Default: StoryObj<{ defaultOpen: boolean }> = {
  render: (args) => (
    <Details defaultOpen={args.defaultOpen}>
      <Details.Summary>Details</Details.Summary>
      <div className="card-1 p-4">Peekaboo!</div>
    </Details>
  ),
  args: {
    defaultOpen: true,
  },
}
