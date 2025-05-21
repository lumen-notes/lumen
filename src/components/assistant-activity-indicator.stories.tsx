import { StoryObj } from "@storybook/react"
import { AssistantActivityIndicator } from "./assistant-activity-indicator"

export default {
  title: "AssistantActivityIndicator",
  component: AssistantActivityIndicator,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    state: {
      control: {
        type: "select",
      },
      options: ["idle", "thinking", "speaking"],
    },
  },
}

type Story = StoryObj<typeof AssistantActivityIndicator>

export const Thinking: Story = {
  render: (args) => {
    return (
      <AssistantActivityIndicator state={args.state} stream={undefined}>
        <div style={{ width: "64px", height: "32px" }} />
      </AssistantActivityIndicator>
    )
  },
  args: {
    state: "thinking",
  },
}

export const Speaking: Story = {
  render: (args) => {
    return (
      <AssistantActivityIndicator state={args.state} stream={undefined}>
        <div style={{ width: "64px", height: "32px" }} />
      </AssistantActivityIndicator>
    )
  },
  args: {
    state: "speaking",
  },
}
