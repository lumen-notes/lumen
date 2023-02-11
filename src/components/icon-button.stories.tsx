import { IconButton } from "./icon-button"
import { SearchIcon16 } from "./icons"

export default {
  title: "IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  args: {
    "aria-label": "Search",
    children: <SearchIcon16 />,
  },
}

export const WithKeyboardShortcut = {
  args: {
    "aria-label": "Search",
    children: <SearchIcon16 />,
    shortcut: ["⌘", "F"],
  },
}
