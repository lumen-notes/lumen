import { CheckIcon16, NoteIcon16 } from "./icons"
import { Toast } from "./toast"

export default {
  title: "Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  args: {
    children: "This is a toast message",
  },
}

export const WithIcon = {
  args: {
    icon: <CheckIcon16 />,
    children: "Copied to clipboard",
  },
}

export const WithLongMessage = {
  args: {
    icon: <NoteIcon16 />,
    children:
      "This is a very long message that should wrap onto multiple lines to demonstrate how the toast component handles text overflow and line wrapping in a natural way",
  },
}
