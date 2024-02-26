import { StoryObj } from "@storybook/react"
import { Card } from "./card"
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
      <Card className="p-4">Peekaboo!</Card>
    </Details>
  ),
  args: {
    defaultOpen: true,
  },
}
