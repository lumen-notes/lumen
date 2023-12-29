import { Checkbox } from "./checkbox"

export default {
  title: "Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  args: {
    disabled: false,
  },
}

export const Checked = {
  args: {
    checked: true,
    disabled: false,
  },
}

export const Disabled = {
  args: {
    checked: true,
    disabled: true,
  },
}
