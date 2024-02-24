import { PillButton } from "./pill-button"

export default {
  title: "PillButton",
  component: PillButton,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    onClick: { action: "onClick" },
  },
}

export const Primary = {
  args: {
    children: "Pill button",
    variant: "primary",
    removable: false,
  },
}

export const Secondary = {
  args: {
    children: "Pill button",
    variant: "secondary",
    removable: false,
  },
}

export const Dashed = {
  args: {
    children: "Pill button",
    variant: "dashed",
    removable: false,
  },
}

export const Removable = {
  args: {
    children: "Pill button",
    variant: "primary",
    removable: true,
  },
}
