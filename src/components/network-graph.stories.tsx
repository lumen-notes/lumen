import React from "react"
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

export const FixedNode = {
  render: (args: NetworkGraphProps) => {
    return (
      <div className="h-screen w-screen">
        <NetworkGraph {...args} />
      </div>
    )
  },
  args: {
    nodes: [
      { id: "0", title: "Node 0 (fixed)", fx: 0, fy: 0 },
      { id: "1", title: "Node 1" },
      { id: "2", title: "Node 2" },
      { id: "3", title: "Node 3" },
    ],
    links: [
      { source: "0", target: "1" },
      { source: "0", target: "2" },
      { source: "0", target: "3" },
      { source: "1", target: "2" },
    ],
  },
}
