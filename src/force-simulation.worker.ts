import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from "d3-force"

export type Node = SimulationNodeDatum & { id: string; title: string }
export type Link = SimulationLinkDatum<Node>

let nodes: Node[] = []
let links: Link[] = []

const simulation = forceSimulation<Node>()
  .nodes(nodes)
  .force(
    "link",
    forceLink<Node, Link>(links).id((d) => d.id),
  )
  .force("charge", forceManyBody().strength(-100))
  .force("collide", forceCollide().radius(64).iterations(2))
  .on("tick", () => postMessage({ nodes, links }))

onmessage = (event: MessageEvent<{ nodes: Node[]; links: Link[] }>) => {
  nodes = event.data.nodes.map((node) => {
    const existingNode = nodes.find((n) => n.id === node.id)
    return { ...node, x: existingNode?.x, y: existingNode?.y }
  })

  links = event.data.links

  simulation.nodes(nodes).force(
    "link",
    forceLink<Node, Link>(links).id((d) => d.id),
  )

  simulation.alpha(1).restart()
}
