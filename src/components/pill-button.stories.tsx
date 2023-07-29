import { PillButton } from "./pill-button"

export default {
  title: "PillButton",
  component: PillButton,
  parameters: {
    layout: "centered",
  },
}

export const Primary = {
  args: {
    children: "Pill button",
    variant: "primary",
  },
}

export const Secondary = {
  args: {
    children: "Pill button",
    variant: "secondary",
  },
}

export const Dashed = {
  args: {
    children: "Pill button",
    variant: "dashed",
  },
}
