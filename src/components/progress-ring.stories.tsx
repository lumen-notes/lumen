import { ProgressRing } from "./progress-ring"

export default {
  title: "ProgressRing",
  component: ProgressRing,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
    },
  },
}

export const Default = {
  args: {
    size: 24,
    value: 0.65,
    strokeWidth: 3,
  },
}
