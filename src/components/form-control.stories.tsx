import { FormControl } from "./form-control"
import { TextInput } from "./text-input"

export default {
  title: "FormControl",
  component: FormControl,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  render: () => {
    return (
      <FormControl htmlFor="name" label="Name">
        <TextInput id="name" />
      </FormControl>
    )
  },
}

export const WithDescription = {
  render: () => {
    return (
      <FormControl
        htmlFor="commit-message"
        label="Commit message"
        description='⌘⏎ to commit on "main"'
      >
        <TextInput id="commit-message" />
      </FormControl>
    )
  },
}

export const Required = {
  render: () => {
    return (
      <FormControl htmlFor="description" label="Description" required>
        <TextInput id="description" />
      </FormControl>
    )
  },
}

export const WithVisuallyHiddenLabel = {
  render: () => {
    return (
      <FormControl htmlFor="name" label="Name" visuallyHideLabel>
        <TextInput id="name" placeholder="Name" />
      </FormControl>
    )
  },
}
