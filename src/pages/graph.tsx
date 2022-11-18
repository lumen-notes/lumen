import React from "react"
import { GlobalStateContext } from "../global-state"
import { useActor } from "@xstate/react"
import Graph from "graphology"
// import {
//   forceCenter,
//   forceLink,
//   forceManyBody,
//   forceSimulation,
//   SimulationLinkDatum,
//   SimulationNodeDatum,
// } from "d3-force"
// import { Node, Link } from "../simulate-force.worker"

// type NodeType = "note" | "tag" | "date"

// type Node = SimulationNodeDatum & {
//   id: string
// }

// type Link = SimulationLinkDatum<Node>

// function simulateForce({
//   nodes,
//   links,
//   width,
//   height,
// }: {
//   nodes: Node[]
//   links: Link[]
//   width: number
//   height: number
// }): Promise<{ nodes: Node[]; links: Link[] }> {
//   const nodesCopy = nodes.map((node) => ({ ...node }))
//   const linksCopy = links.map((link) => ({ ...link }))

//   return new Promise((resolve) => {
//     const simulation = forceSimulation(nodesCopy)
//       .force(
//         "link",
//         forceLink<Node, Link>(linksCopy).id((d) => d.id),
//       )
//       .force("center", forceCenter(width / 2, height / 2))
//       .force("charge", forceManyBody().strength(-10))

//     simulation.on("end", () => resolve({ nodes: nodesCopy, links: linksCopy }))
//   })
// }

// function useGraph({
//   nodes,
//   links,
//   width,
//   height,
// }: {
//   nodes: Node[]
//   links: Link[]
//   width: number
//   height: number
// }) {
//   const [graph, setGraph] = React.useState<{ nodes: Node[]; links: Link[] }>({
//     nodes: [],
//     links: [],
//   })

//   React.useEffect(() => {
//     const worker = new Worker(new URL("../simulate-force.worker.ts", import.meta.url), {
//       type: "module",
//     })

//     worker.postMessage({ nodes, links })
//     worker.onmessage = (event) => {
//       setGraph(event.data)
//     }

//     return () => {
//       worker.terminate()
//     }
//   }, [])

//   return graph
// }

// const worker = new Worker(new URL("../simulate-force.worker.ts", import.meta.url), {
//   type: "module",
// })

export function GraphPage() {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  const graph = React.useMemo(() => {
    const graph = new Graph({ type: "undirected", multi: false })

    for (const noteId of Object.keys(state.context.notes)) {
      graph.addNode(noteId)
    }

    for (const [noteId, backlinks] of Object.entries(state.context.backlinks)) {
      if (!graph.hasNode(noteId)) continue

      for (const backlink of backlinks) {
        if (!graph.hasNode(backlink) || graph.hasEdge(backlink, noteId)) continue

        graph.addEdge(backlink, noteId)
      }
    }

    return graph
  }, [state.context.notes, state.context.backlinks])

  const nodes = graph.mapNodes((id) => ({ id }))
  const links = graph.mapEdges((edge, attributes, source, target) => ({ source, target }))

  return (
    <div className="p-3">
      <pre>{JSON.stringify({ nodes, links }, null, 2)}</pre>
    </div>
    // <svg width="500" height="500">
    //   {graph.links.map((link) => (
    //     <line
    //       key={`${link.source.id}-${link.target.id}`}
    //       x1={link.source.x}
    //       y1={link.source.y}
    //       x2={link.target.x}
    //       y2={link.target.y}
    //       strokeWidth="1"
    //       className="stroke-text"
    //     />
    //   ))}
    //   {graph.nodes.map((node) => (
    //     <circle key={node.id} cx={node.x} cy={node.y} r={5} className="fill-text" />
    //   ))}
    // </svg>
  )
}
