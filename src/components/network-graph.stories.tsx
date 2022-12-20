import { NetworkGraph, NetworkGraphProps } from "./network-graph"

export default {
  title: "NetworkGraph",
  component: NetworkGraph,
  parameters: {
    layout: "fullscreen",
  },
}

const numNodes = 100
const numLinks = 100

export const Default = {
  render: (args: NetworkGraphProps) => {
    return (
      <div className="h-screen w-screen">
        <NetworkGraph {...args} />
      </div>
    )
  },
  args: {
    nodes: Array.from({ length: numNodes }).map((_, i) => ({
      id: i.toString(),
      title: `Node ${i}`,
    })),
    links: Array.from({ length: numLinks }).map((_, i) => ({
      source: Math.floor(Math.random() * numNodes).toString(),
      target: Math.floor(Math.random() * numNodes).toString(),
    })),
  },
}
