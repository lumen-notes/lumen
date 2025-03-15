import { Button } from "./button"
import { SpinningBorder } from "./spinning-border"

export default {
  title: "SpinningBorder",
  component: SpinningBorder,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  render: () => {
    return (
      <SpinningBorder>
        <Button>Button</Button>
      </SpinningBorder>
    )
  },
}
