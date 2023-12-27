import { TextInput } from "./text-input"

export default {
  title: "TextInput",
  component: TextInput,
  parameters: {
    layout: "centered",
  },
}

export const Default = {}

export const WithValue = {
  args: {
    defaultValue: "Example value",
  },
}
