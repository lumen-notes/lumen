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
type NodeWithPosition = Omit<Node, "x" | "y"> & { x: number; y: number }

type Link = SimulationLinkDatum<Node>
type LinkWithPosition = Omit<Link, "source" | "target"> & {
  source: NodeWithPosition
  target: NodeWithPosition
}

type NetworkGraphProps = {
  width: number
  height: number
  nodes: Node[]
  links: Link[]
  onClick?: (node?: Node) => void
}

// TODO: Highlight nodes on hover
// TODO: Disable animation for motion-sensitive users
// TODO: Drag nodes
export function NetworkGraph({ width, height, nodes, links, onClick }: NetworkGraphProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const simulationNodes = React.useRef<Node[]>([])
  const simulationLinks = React.useRef<Link[]>([])
  const pixelRatio = window.devicePixelRatio ?? 1
  const radius = 4
  const widthRef = React.useRef(width)
  const heightRef = React.useRef(height)
  const transformRef = React.useRef(zoomIdentity)
  const onClickRef = React.useRef(onClick)

  React.useEffect(() => {
    onClickRef.current = onClick
  }, [onClick])

  const drawToCanvas = React.useCallback(() => {
    if (!canvasRef.current) return

    const context = canvasRef.current.getContext("2d")

    if (!context) return

    const documentStyle = window.getComputedStyle(document.documentElement)

    /** Returns the computed value of a CSS custom property (variable) */
    function cssVar(property: string) {
      return documentStyle.getPropertyValue(property)
    }

    // Improve rendering on high-resolution displays
    // https://stackoverflow.com/questions/41763580/svg-rendered-into-canvas-blurred-on-retina-display
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    // Clear the canvas
    context.clearRect(0, 0, widthRef.current, heightRef.current)

    // Draw the links
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

      const [sourceX, sourceY] = transformRef.current.apply([
        link.source.x ?? 0,
        link.source.y ?? 0,
      ])

      const [targetX, targetY] = transformRef.current.apply([
        link.target.x ?? 0,
        link.target.y ?? 0,
      ])

      drawLink({
        context,
        link: {
          ...link,
          source: { ...link.source, x: sourceX, y: sourceY },
          target: { ...link.source, x: targetX, y: targetY },
        },
        cssVar,
      })
    }

    // Draw the nodes
    for (const node of simulationNodes.current) {
      if (!node.x || !node.y) continue

      const [x, y] = transformRef.current.apply([node.x, node.y])

      drawNode({
        context,
        node: { ...node, x, y },
        cssVar,
      })
    }
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

    simulation
      .nodes(simulationNodes.current)
      .force(
        "link",
        forceLink<Node, Link>(simulationLinks.current).id((d) => d.id),
      )
      .alpha(1)
      .restart()
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
      zoom<HTMLCanvasElement, Node>()
        .scaleExtent([0.1, 10])
        .on("zoom", ({ transform }) => {
          transformRef.current = transform
          requestAnimationFrame(() => drawToCanvas())
        }),
    )
  }, [drawToCanvas])

  // Redraw the canvas when the user's color scheme preference changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    function handleChange() {
      requestAnimationFrame(() => drawToCanvas())
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [drawToCanvas])

  React.useEffect(() => {
    const canvas = canvasRef.current

    function handleClick(event: MouseEvent) {
      const canvasRect = canvas?.getBoundingClientRect()

      if (!canvasRect) return

      // Get the coordinates of the click relative to the canvas
      const [x, y] = transformRef.current.invert([
        event.clientX - canvasRect.left,
        event.clientY - canvasRect.top,
      ])

      // Find the node that was clicked
      const node = simulationNodes.current.find((node) => {
        if (!node.x || !node.y) return false

        const dx = node.x - x
        const dy = node.y - y
        const targetRadius = radius * 2
        return Math.sqrt(dx * dx + dy * dy) < targetRadius
      })

      onClickRef.current?.(node)
    }

    canvas?.addEventListener("click", handleClick)
    return () => canvas?.removeEventListener("click", handleClick)
  })

  return (
    <canvas
      ref={canvasRef}
      width={width * pixelRatio}
      height={height * pixelRatio}
      style={{ width, height }}
    />
  )
}

function drawLink({
  context,
  link,
  cssVar,
}: {
  context: CanvasRenderingContext2D
  link: LinkWithPosition
  cssVar: (property: string) => string
}) {
  // Draw a line
  context.beginPath()
  context.strokeStyle = cssVar("--color-border")
  context.lineWidth = 1
  context.moveTo(link.source.x, link.source.y)
  context.lineTo(link.target.x, link.target.y)
  context.stroke()
}

function drawNode({
  context,
  node,
  cssVar,
}: {
  context: CanvasRenderingContext2D
  node: NodeWithPosition
  cssVar: (property: string) => string
}) {
  // Draw a circle
  context.beginPath()
  context.fillStyle = cssVar("--color-text")
  context.moveTo(node.x, node.y)
  context.arc(node.x, node.y, 4, 0, Math.PI * 2)
  context.fill()
}
