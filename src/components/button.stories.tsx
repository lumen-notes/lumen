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
    size: "medium",
  },
}

export const Secondary = {
  args: {
    children: "Button",
    variant: "secondary",
    size: "medium",
  },
}

export const WithKeyboardShortcut = {
  args: {
    children: "Save",
    shortcut: ["⌘", "⏎"],
    size: "medium",
  },
}

export const Disabled = {
  args: {
    children: "Button",
    disabled: true,
    size: "medium",
  },
}

export const Small = {
  args: {
    children: "Button",
    variant: "secondary",
    size: "small",
  },
}
