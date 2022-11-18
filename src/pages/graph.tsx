import React from "react"
import { GlobalStateContext } from "../global-state"
import { useActor } from "@xstate/react"
import Graph from "graphology"
// import { forceSimulation, forceLink, forceCenter } from "d3-force"
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from "d3-force"
import { select } from "d3-selection"
// import { Node, Link } from "../simulate-force.worker"

// type NodeType = "note" | "tag" | "date"

type Node = SimulationNodeDatum & {
  id: string
}

type Link = SimulationLinkDatum<Node>

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

  const { nodes, links } = React.useMemo(() => {
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

    const nodes = graph.mapNodes((id) => ({ id }))
    const links = graph.mapEdges((edge, attributes, source, target) => ({ source, target }))

    return { nodes, links }
  }, [state.context.notes, state.context.backlinks])

  // const ref = React.useRef<SVGSVGElement>(null)
  const ref = React.useRef<HTMLCanvasElement>(null)
  const width = 800
  const height = 600

  const simulationNodes = React.useRef([])
  const simulationLinks = React.useRef([])

  const updateDom = React.useCallback(() => {
    if (!ref.current) return
    // const width = ref.current.width
    // const height = ref.current.height
    const ctx = ref.current.getContext("2d")

    if (!ctx) return

    // clear the canvas
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = "green"

    ctx.beginPath()
    ctx.strokeStyle = "grey"
    ctx.lineWidth = 0.3
    simulationLinks.current.forEach((node) => {
      // draw a circle
      ctx.moveTo(node.source.x, node.source.y)
      ctx.lineTo(node.target.x, node.target.y)
    })
    ctx.stroke()

    ctx.beginPath()
    simulationNodes.current.forEach((node) => {
      // draw a circle
      ctx.moveTo(node.x, node.y)
      ctx.arc(node.x, node.y, 10, 0, Math.PI * 2)
    })
    ctx.fill()

    // d3-rendering
    // const wrapper = select(ref.current)
    // wrapper
    //   .selectAll("circle")
    //   .data(nodesCopy)
    //   .join("circle")
    //   .attr("cx", (d: any) => d.x)
    //   .attr("cy", (d: any) => d.y)
    //   .attr("r", 10)
  }, [])

  const simulation = React.useMemo(() => {
    return forceSimulation<Node>(simulationNodes.current)
      .force(
        "link",
        forceLink<Node, Link>(simulationLinks.current).id((d) => d.id),
      )
      .force("center", forceCenter(width / 2, height / 2))
      .on("tick", updateDom)
  }, [])

  React.useEffect(() => {
    simulationNodes.current = nodes.map((node) => {
      const cachedNode = simulationNodes.current.find((cachedNode) => cachedNode.id === node.id)
      return { ...node, x: cachedNode?.x, y: cachedNode?.y }
    })
    simulationLinks.current = links.map((link) => ({ ...link }))

    simulation
      .alpha(1)
      .nodes(simulationNodes.current)
      .force(
        "link",
        forceLink<Node, Link>(simulationLinks.current).id((d) => d.id),
      )
      .force("charge", forceManyBody().strength(-10))
    // .stop()
    // simulation.tick(10)
    // updateDom()
  }, [nodes, links])

  return (
    <div className="h-full w-full p-3">
      {/* <pre>{JSON.stringify({ nodes, links }, null, 2)}</pre> */}

      <canvas width={width} height={height} ref={ref} />
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
