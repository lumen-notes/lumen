import { Switch } from "./switch"

export default {
  title: "Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
}

export const Default = {}

export const Checked = {
  args: {
    checked: true,
  },
}
