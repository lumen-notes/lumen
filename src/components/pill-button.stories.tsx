import { PillButton } from "./pill-button"

export default {
  title: "PillButton",
  component: PillButton,
  parameters: {
    layout: "centered",
  },
}

export const Fill = {
  args: {
    children: "Pill button",
    variant: "fill",
  },
}

export const Dashed = {
  args: {
    children: "Pill button",
    variant: "dashed",
  },
}
