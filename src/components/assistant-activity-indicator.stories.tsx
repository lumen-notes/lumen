import { Button } from "./button"
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
        <Button>Button</Button>
      </AssistantActivityIndicator>
    )
  },
  args: {
    state: "idle",
  },
}
