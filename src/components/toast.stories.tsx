import { EditIcon16, NoteIcon16, TrashIcon16 } from "./icons"
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
    icon: <EditIcon16 />,
    children: "Edited note",
  },
}

export const CustomIconColor = {
  args: {
    icon: <TrashIcon16 className="text-text-danger" />,
    children: "Deleted note",
    variant: "danger",
  },
}

export const LongMessage = {
  args: {
    icon: <NoteIcon16 />,
    children:
      "This is a very long message that should wrap onto multiple lines to demonstrate how the toast component handles text overflow and line wrapping in a natural way",
  },
}
