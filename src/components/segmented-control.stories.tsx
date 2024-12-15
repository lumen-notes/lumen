import { useState } from "react"
import { SegmentedControl, SegmentedControlProps } from "./segmented-control"

export default {
  title: "SegmentedControl",
  component: SegmentedControl,
  subcomponents: {
    Segment: SegmentedControl.Segment,
  },
  parameters: {
    layout: "centered",
  },
}

export const Default = {
  render: (args: SegmentedControlProps) => {
    const [selected, setSelected] = useState("read")
    return (
      <SegmentedControl {...args}>
        <SegmentedControl.Segment
          selected={selected === "read"}
          onClick={() => setSelected("read")}
        >
          Read
        </SegmentedControl.Segment>
        <SegmentedControl.Segment
          selected={selected === "write"}
          onClick={() => setSelected("write")}
        >
          Write
        </SegmentedControl.Segment>
      </SegmentedControl>
    )
  },
  args: {
    size: "medium",
  },
}

export const Small = {
  render: () => (
    <SegmentedControl size="small">
      <SegmentedControl.Segment selected>Read</SegmentedControl.Segment>
      <SegmentedControl.Segment>Write</SegmentedControl.Segment>
    </SegmentedControl>
  ),
}

export const WithKeyboardShortcut = {
  render: () => (
    <SegmentedControl>
      <SegmentedControl.Segment selected>Read</SegmentedControl.Segment>
      <SegmentedControl.Segment shortcut={["⌘", "E"]}>Write</SegmentedControl.Segment>
    </SegmentedControl>
  ),
}
