import { Button } from "./button"

export default {
  title: "Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
}

export const Primary = {
  args: {
    children: "Button",
    variant: "primary",
  },
}

export const Secondary = {
  args: {
    children: "Button",
    variant: "secondary",
  },
}

export const WithKeyboardShortcut = {
  args: {
    children: "Save",
    shortcut: ["⌘", "⏎"],
  },
}

export const Disabled = {
  args: {
    children: "Button",
    disabled: true,
  },
}
