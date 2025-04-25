import { AssistantActivityIndicator } from "./assistant-activity-indicator"

export default {
  title: "AssistantActivityIndicator",
  component: AssistantActivityIndicator,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  render: (args: { state: "idle" | "thinking" | "speaking" }) => {
    return (
      <AssistantActivityIndicator state={args.state}>
        <div style={{ width: "64px", height: "32px" }} />
      </AssistantActivityIndicator>
    )
  },
  args: {
    state: "idle",
  },
}
