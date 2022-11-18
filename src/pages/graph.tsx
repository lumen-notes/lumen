import { useActor } from "@xstate/react"
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from "d3-force"
import Graph from "graphology"
import React from "react"
import { GlobalStateContext } from "../global-state"

type Node = SimulationNodeDatum & { id: string }

type Link = SimulationLinkDatum<Node>

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

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const width = 1000
  const height = 1000
  const simulationNodes = React.useRef<Node[]>([])
  const simulationLinks = React.useRef<Link[]>([])

  const drawToCanvas = React.useCallback(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")

    if (!ctx) return

    const style = window.getComputedStyle(document.documentElement)

    // Clear the canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.width)

    // Draw the links
    ctx.beginPath()
    ctx.strokeStyle = style.getPropertyValue("--color-border")
    ctx.lineWidth = 1
    for (const link of simulationLinks.current) {
      if (
        typeof link.source !== "object" ||
        typeof link.target !== "object" ||
        !link.source.x ||
        !link.source.y ||
        !link.target.x ||
        !link.target.y
      ) {
        continue
      }

      // Draw a line
      ctx.moveTo(link.source.x, link.source.y)
      ctx.lineTo(link.target.x, link.target.y)
    }
    ctx.stroke()

    // Draw the nodes
    ctx.beginPath()
    ctx.fillStyle = style.getPropertyValue("--color-text")
    for (const node of simulationNodes.current) {
      if (!node.x || !node.y) continue

      // Draw a circle
      ctx.moveTo(node.x, node.y)
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2)
    }
    ctx.fill()
  }, [])

  const simulation = React.useMemo(() => {
    return forceSimulation<Node>()
      .force("center", forceCenter(width / 2, height / 2))
      .force("charge", forceManyBody().strength(-10))
      .on("tick", drawToCanvas)
  }, [drawToCanvas])

  React.useEffect(() => {
    simulationNodes.current = nodes.map((node) => {
      const cachedNode = simulationNodes.current.find((cachedNode) => cachedNode.id === node.id)

      // Preserve the position of the node if it exists
      return { ...node, x: cachedNode?.x, y: cachedNode?.y }
    })

    simulationLinks.current = links.map((link) => ({ ...link }))

    simulation.nodes(simulationNodes.current).force(
      "link",
      forceLink<Node, Link>(simulationLinks.current).id((d) => d.id),
    )
  }, [nodes, links, simulation])

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  )
}
