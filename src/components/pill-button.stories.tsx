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
    removable: false,
  },
  argTypes: { onRemove: { action: "onRemove" } },
}

export const Secondary = {
  args: {
    children: "Pill button",
    variant: "secondary",
    removable: false,
  },
  argTypes: { onRemove: { action: "onRemove" } },
}

export const Dashed = {
  args: {
    children: "Pill button",
    variant: "dashed",
    removable: false,
  },
  argTypes: { onRemove: { action: "onRemove" } },
}
