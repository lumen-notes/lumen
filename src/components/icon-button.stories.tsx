import { IconButton } from "./icon-button"
import { MoreIcon16, SearchIcon16 } from "./icons"

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

export const Small = {
  args: {
    "aria-label": "More actions",
    children: <MoreIcon16 />,
    size: "small",
  },
}
