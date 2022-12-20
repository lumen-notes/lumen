import { NetworkGraph, NetworkGraphProps } from "./network-graph"

export default {
  title: "NetworkGraph",
  component: NetworkGraph,
  parameters: {
    layout: "fullscreen",
  },
}

export const Default = {
  render: (args: NetworkGraphProps) => (
    <div className="h-screen w-screen">
      <NetworkGraph {...args} />
    </div>
  ),
  args: {
    nodes: [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
      { id: "c", title: "C" },
    ],
    links: [
      { source: "a", target: "b" },
      { source: "a", target: "c" },
    ],
  },
}
