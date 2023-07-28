import { Checkbox } from "./checkbox"

export default {
  title: "Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    disabled: { control: "boolean" },
  },
}

export const Default = {
  args: {
    disabled: false,
  },
}
