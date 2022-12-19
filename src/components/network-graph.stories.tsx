import { NetworkGraph } from "./network-graph"

export default {
  title: "NetworkGraph",
  component: NetworkGraph,
  parameters: {
    layout: "fullscreen",
  },
}

export const Default = {
  args: {
    width: 500,
    height: 500,
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
