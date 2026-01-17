import { Label } from "./label"
import { DotIcon8, TagIcon12 } from "./icons"
import { ProgressRing } from "./progress-ring"

export default {
  title: "Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  args: {
    children: "Label",
  },
}

export const WithIcon = {
  args: {
    icon: <TagIcon12 />,
    children: "book",
  },
}

export const WithSmallIcon = {
  args: {
    icon: <DotIcon8 className="text-text-pending" />,
    children: "Unsaved",
  },
}

export const WithProgressRing = {
  args: {
    icon: <ProgressRing size={14} value={0.5} strokeWidth={2} />,
    children: "1/2",
  },
}
