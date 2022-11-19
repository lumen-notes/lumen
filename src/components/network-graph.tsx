import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from "d3-force"
import { select } from "d3-selection"
import { zoom, zoomIdentity } from "d3-zoom"
import React from "react"

type Node = SimulationNodeDatum & { id: string }

type Link = SimulationLinkDatum<Node>

type NetworkGraphProps = {
  width: number
  height: number
  nodes: Node[]
  links: Link[]
}

// TODO: Add click handlers
// TODO: Highlight nodes on hover
// TODO: Disable animation for motion-sensitive users
// TODO: Drag nodes
export function NetworkGraph({ width, height, nodes, links }: NetworkGraphProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const simulationNodes = React.useRef<Node[]>([])
  const simulationLinks = React.useRef<Link[]>([])
  const pixelRatio = window.devicePixelRatio ?? 1
  const widthRef = React.useRef(width)
  const heightRef = React.useRef(height)
  const transformRef = React.useRef(zoomIdentity)

  const drawToCanvas = React.useCallback(() => {
    if (!canvasRef.current) return

    const context = canvasRef.current.getContext("2d")

    if (!context) return

    const style = window.getComputedStyle(document.documentElement)

    // Improve rendering on high-resolution displays
    // https://stackoverflow.com/questions/41763580/svg-rendered-into-canvas-blurred-on-retina-display
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    // Clear the canvas
    context.clearRect(0, 0, widthRef.current, heightRef.current)

    // Draw the links
    context.beginPath()
    context.strokeStyle = style.getPropertyValue("--color-border")
    context.lineWidth = 1
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

      const [sourceX, sourceY] = transformRef.current.apply([link.source.x, link.source.y])
      const [targetX, targetY] = transformRef.current.apply([link.target.x, link.target.y])

      // Draw a line
      context.moveTo(sourceX, sourceY)
      context.lineTo(targetX, targetY)
    }
    context.stroke()

    // Draw the nodes
    context.beginPath()
    context.fillStyle = style.getPropertyValue("--color-text")
    for (const node of simulationNodes.current) {
      if (!node.x || !node.y) continue

      const [x, y] = transformRef.current.apply([node.x, node.y])

      // Draw a circle
      context.moveTo(x, y)
      context.arc(x, y, 4, 0, Math.PI * 2)
    }
    context.fill()
  }, [pixelRatio])

  const simulation = React.useMemo(() => {
    return forceSimulation<Node>()
      .force("charge", forceManyBody().strength(-10))
      .force("center", forceCenter(window.innerWidth / 2, window.innerHeight / 2))
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

  // Redraw the canvas when the container is resized
  React.useEffect(() => {
    widthRef.current = width
    heightRef.current = height
    requestAnimationFrame(() => drawToCanvas())
  }, [width, height, drawToCanvas])

  // Zoom and pan
  React.useEffect(() => {
    if (!canvasRef.current) return

    select<HTMLCanvasElement, Node>(canvasRef.current).call(
      zoom<HTMLCanvasElement, Node>().on("zoom", ({ transform }) => {
        transformRef.current = transform
        requestAnimationFrame(() => drawToCanvas())
      }),
    )
  }, [drawToCanvas])

  return (
    <canvas
      ref={canvasRef}
      width={width * pixelRatio}
      height={height * pixelRatio}
      style={{ width, height }}
    />
  )
}
