import { select } from "d3-selection"
import { zoom, zoomIdentity, ZoomTransform } from "d3-zoom"
import * as React from "react"
import { useMedia } from "react-use"
import { Link, Node } from "../force-simulation.worker"

type NodeState = "idle" | "hover" | "selected" | "disabled"

type LinkState = "idle" | "selected" | "disabled"

type Position = { x: number; y: number }

type Direction = "up" | "down" | "left" | "right"

type Axis = "x" | "y"

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
}

const DIRERCTION_TO_AXIS: Record<Direction, Axis> = {
  up: "y",
  down: "y",
  left: "x",
  right: "x",
}

type Bleed = number | [number, number] | [number, number, number, number]

export type NetworkGraphInstance = {
  focus: () => void
  centerInView: (nodeId: string) => void
}

type NetworkGraphProps = {
  width: number
  height: number
  nodes: Node[]
  links: Link[]
  selectedId?: string
  hoveredId?: string
  targetRadius?: number
  bleed?: Bleed
  onSelect?: (node: Node | null) => void
  onHover?: (node: Node | null) => void
}

export const NetworkGraph = React.forwardRef<NetworkGraphInstance, NetworkGraphProps>(
  (
    {
      width,
      height,
      nodes,
      links,
      selectedId = "",
      hoveredId = "",
      targetRadius = 24,
      bleed = 48,
      onSelect,
      onHover,
    },
    ref,
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [prevNodes, setPrevNodes] = React.useState<Node[]>(nodes)
    const [prevLinks, setPrevLinks] = React.useState<Link[]>(links)
    const [prevSelectedId, setPrevSelectedId] = React.useState(selectedId)
    const [simulationNodes, setSimulationNodes] = React.useState<Node[]>(nodes)
    const [simulationLinks, setSimulationLinks] = React.useState<Link[]>(links)
    const { transform, scrollIntoView, centerInView } = useViewport(canvasRef, width, height)
    const pixelRatio = window.devicePixelRatio || 1
    const [_, setIsCanvasFocused] = React.useState(false)
    const cssVar = useCssVar()
    const simulationWorkerRef = React.useRef<Worker>()

    React.useEffect(() => {
      const worker = new Worker(new URL("../force-simulation.worker.ts", import.meta.url), {
        type: "module",
      })

      // Initialize nodes and links
      worker.postMessage({ nodes, links })

      worker.onmessage = (event) => {
        const { nodes, links } = event.data
        setSimulationNodes(nodes)
        setSimulationLinks(links)
      }

      simulationWorkerRef.current = worker

      return () => {
        worker.terminate()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Update simulation when nodes or links change
    if (nodes !== prevNodes || links !== prevLinks) {
      simulationWorkerRef.current?.postMessage({ nodes, links })
      setPrevNodes(nodes)
      setPrevLinks(links)
    }

    // Scroll to selected node when selectedId changes
    if (selectedId && selectedId !== prevSelectedId) {
      const selectedNode = simulationNodes.find((node) => node.id === selectedId)
      if (selectedNode) scrollIntoView(selectedNode, { bleed })
      setPrevSelectedId(selectedId)
    }

    React.useImperativeHandle(ref, () => ({
      focus() {
        canvasRef.current?.focus()
      },
      centerInView(nodeId: string) {
        const node = simulationNodes.find((node) => node.id === nodeId)
        if (node) centerInView(node)
      },
    }))

    // Draw graph to canvas
    React.useEffect(() => {
      function draw() {
        const context = canvasRef.current?.getContext("2d", { alpha: false })
        if (!context) return

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

        // Clear canvas
        context.fillStyle = cssVar("--color-bg-inset")
        context.fillRect(0, 0, width, height)

        const connectedNodes = new Set<Node>()
        const connectedLinks = new Set<Link>()

        // Draw links
        for (const link of simulationLinks) {
          if (typeof link.source !== "object" || typeof link.target !== "object") return

          if (link.source.id === selectedId) {
            connectedNodes.add(link.target)
            connectedLinks.add(link)
            continue
          }

          if (link.target.id === selectedId) {
            connectedNodes.add(link.source)
            connectedLinks.add(link)
            continue
          }

          let state: LinkState = "idle"

          if (selectedId) {
            state = "disabled"
          }

          drawLink(link, {
            state,
            canvas: canvasRef.current,
            context,
            transform,
            cssVar,
          })
        }

        let selectedNode: Node | null = null
        let hoveredNode: Node | null = null

        // Draw nodes
        for (const node of simulationNodes) {
          if (node.id === selectedId) {
            selectedNode = node
            continue
          }

          if (node.id === hoveredId) {
            hoveredNode = node
            continue
          }

          if (connectedNodes.has(node)) {
            continue
          }

          let state: NodeState = "idle"

          if (node.id === hoveredId) {
            state = "hover"
          } else if (selectedId) {
            state = "disabled"
          }

          drawNode(node, {
            state,
            canvas: canvasRef.current,
            context,
            transform,
            cssVar,
          })
        }

        // Draw connected links
        for (const link of connectedLinks) {
          drawLink(link, {
            state: "selected",
            canvas: canvasRef.current,
            context,
            transform,
            cssVar,
          })
        }

        // Draw connected nodes
        for (const node of connectedNodes) {
          let state: NodeState = "idle"

          if (node.id === hoveredId) {
            state = "hover"
          }

          drawNode(node, {
            state,
            canvas: canvasRef.current,
            context,
            transform,
            cssVar,
          })
        }

        // Draw hovered node
        if (hoveredNode) {
          drawNode(hoveredNode, {
            state: "hover",
            canvas: canvasRef.current,
            context,
            transform,
            cssVar,
          })
        }

        // Draw selected node
        if (selectedNode) {
          drawNode(selectedNode, {
            state: "selected",
            canvas: canvasRef.current,
            context,
            transform,
            cssVar,
          })
        }
      }

      const frame = window.requestAnimationFrame(draw)
      return () => window.cancelAnimationFrame(frame)
    })

    return (
      <canvas
        ref={canvasRef}
        tabIndex={0}
        width={width * pixelRatio}
        height={height * pixelRatio}
        style={{
          width,
          height,
          cursor: hoveredId ? "pointer" : "default",
          outline: "none",
        }}
        onFocus={() => setIsCanvasFocused(true)}
        onBlur={() => setIsCanvasFocused(false)}
        onClick={(event) => {
          const position = getRelativePosition(event, transform)

          const closestNode = getClosestNode(simulationNodes, position, targetRadius / transform.k)

          onSelect?.(closestNode)
        }}
        onMouseMove={(event) => {
          React.startTransition(() => {
            const position = getRelativePosition(event, transform)

            const closestNode = getClosestNode(
              simulationNodes,
              position,
              targetRadius / transform.k,
            )

            onHover?.(closestNode)
          })
        }}
        onKeyDown={(event) => {
          // Unselect node with `escape`
          if (event.key === "Escape") {
            event.preventDefault()
            onSelect?.(null)
          }

          // Reselect previously selected node with `tab`
          if (event.key === "Tab" && !event.shiftKey && !selectedId) {
            event.preventDefault()

            let node = simulationNodes.find((node) => node.id === prevSelectedId) || null

            // If there is no previous selected node,
            // select the node closest to the center
            if (!node) {
              const [x, y] = transform.invert([width / 2, height / 2])
              node = getClosestNode(simulationNodes, { x, y }, Infinity)
            }

            onSelect?.(node)
          }

          // Traverse with arrow keys
          if (event.key in KEY_TO_DIRECTION) {
            event.preventDefault()

            const nextNode = getNextNode(simulationNodes, selectedId, KEY_TO_DIRECTION[event.key])

            if (nextNode) {
              onSelect?.(nextNode)
            }
          }
        }}
      />
    )
  },
)

type DrawNodeOptions = {
  state: NodeState
  canvas: HTMLCanvasElement | null
  context: CanvasRenderingContext2D
  transform: ZoomTransform
  cssVar: (name: string) => string
}

function drawNode(node: Node, { state, context, transform, canvas, cssVar }: DrawNodeOptions) {
  const isCanvasFocused = document.activeElement === canvas
  const scale = clamp(transform.k, 0, 1)
  const [x, y] = transform.apply([node.x ?? 0, node.y ?? 0])
  const baseRadius = 6
  const baseTextSize = 12
  const baseTextOffset = baseRadius + 8

  const radius = {
    idle: baseRadius * scale,
    hover: baseRadius + 2,
    selected: baseRadius + 2,
    disabled: baseRadius * scale,
  }[state]

  const fill = {
    idle: cssVar("--color-node"),
    hover: cssVar("--color-node"),
    selected: cssVar("--color-node-selected"),
    disabled: cssVar("--color-node-disabled"),
  }[state]

  const textSize = {
    idle: baseTextSize * scale,
    hover: baseTextSize,
    selected: baseTextSize,
    disabled: baseTextSize * scale,
  }[state]

  const textAlpha = {
    idle: scale,
    hover: 1,
    selected: 1,
    disabled: 0,
  }[state]

  const textOffset = {
    idle: baseTextOffset * scale,
    hover: baseTextOffset,
    selected: baseTextOffset,
    disabled: baseTextOffset * scale,
  }[state]

  if (state === "selected" && isCanvasFocused) {
    const lineWidth = 2
    const gap = 1

    // Draw backdrop
    context.beginPath()
    context.arc(x, y, radius + gap + lineWidth / 2, 0, Math.PI * 2)
    context.fillStyle = cssVar("--color-bg-inset")
    context.fill()

    // Draw focus ring
    context.beginPath()
    context.arc(x, y, radius + gap + lineWidth / 2, 0, Math.PI * 2)
    context.strokeStyle = cssVar("--color-border-focus")
    context.lineWidth = lineWidth
    context.stroke()
  }

  // Draw circle
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fillStyle = fill
  context.fill()

  // Draw text
  context.font = `${textSize}px iA Writer Quattro` // TODO: Use CSS variable
  context.textAlign = "center"
  context.textBaseline = "top"
  context.fillStyle = cssVar("--color-text")
  context.globalAlpha = textAlpha
  context.fillText(node.label, x, y + textOffset)
  context.globalAlpha = 1
}

type DrawLinkOptions = {
  state: LinkState
  canvas: HTMLCanvasElement | null
  context: CanvasRenderingContext2D
  transform: ZoomTransform
  cssVar: (name: string) => string
}

function drawLink(link: Link, { state, context, transform, canvas, cssVar }: DrawLinkOptions) {
  if (typeof link.source !== "object" || typeof link.target !== "object") return

  const [sourceX, sourceY] = transform.apply([link.source.x ?? 0, link.source.y ?? 0])
  const [targetX, targetY] = transform.apply([link.target.x ?? 0, link.target.y ?? 0])

  const stroke = {
    idle: cssVar("--color-edge"),
    selected: cssVar("--color-edge-selected"),
    disabled: cssVar("--color-edge-disabled"),
  }[state]

  context.beginPath()
  context.moveTo(sourceX, sourceY)
  context.lineTo(targetX, targetY)
  context.strokeStyle = stroke
  context.lineWidth = 1
  context.stroke()
}

/** Clamps a value between a minimum and maximum value. */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Returns a function that can be used to get the computed value
 * of a CSS custom property (variable).
 */
function useCssVar() {
  const prefersDark = useMedia("(prefers-color-scheme: dark)")

  const documentStyle = React.useMemo(
    () => window.getComputedStyle(document.documentElement),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefersDark],
  )

  const cssVar = React.useCallback(
    (name: string) => documentStyle.getPropertyValue(name),
    [documentStyle],
  )

  return cssVar
}

function useViewport(ref: React.RefObject<HTMLElement>, width: number, height: number) {
  const [zoomTransform, setZoomTransform] = React.useState(zoomIdentity)
  const [offset, setOffset] = React.useState<[number, number]>([
    window.innerWidth / 2,
    window.innerHeight / 2,
  ])

  const transform = zoomTransform.translate(...offset)

  React.useEffect(() => {
    if (!ref.current) return

    const zoomBehavior = zoom<HTMLElement, Node>()
      .scaleExtent([0.1, 5])
      .on("zoom", ({ transform }) => {
        setZoomTransform(transform)
      })

    select<HTMLElement, Node>(ref.current).call(zoomBehavior)
  }, [ref])

  const scrollIntoView = React.useCallback(
    (node: Node, { bleed = 0 }: { bleed?: Bleed } = {}) => {
      const [x, y] = transform.apply([node.x || 0, node.y || 0])

      let [bleedTop, bleedRight, bleedBottom, bleedLeft] = [0, 0, 0, 0]

      // Resolve bleed shorthand
      if (typeof bleed === "number") {
        bleedTop = bleed
        bleedRight = bleed
        bleedBottom = bleed
        bleedLeft = bleed
      } else if (bleed.length === 2) {
        bleedTop = bleed[0]
        bleedRight = bleed[1]
        bleedBottom = bleed[0]
        bleedLeft = bleed[1]
      } else if (bleed.length === 4) {
        bleedTop = bleed[0]
        bleedRight = bleed[1]
        bleedBottom = bleed[2]
        bleedLeft = bleed[3]
      }

      const left = bleedLeft
      const right = width - bleedRight
      const top = bleedTop
      const bottom = height - bleedBottom

      const inView = x > left && x < right && y > top && y < bottom

      if (inView) return

      let dx = 0
      let dy = 0

      if (x < left) {
        dx = x - left
      } else if (x > right) {
        dx = x - right
      }

      if (y < top) {
        dy = y - top
      } else if (y > bottom) {
        dy = y - bottom
      }

      setOffset([offset[0] - dx / transform.k, offset[1] - dy / transform.k])
    },
    [transform, width, height, offset],
  )

  const centerInView = React.useCallback(
    (node: Node) => {
      const [x, y] = transform.apply([node.x || 0, node.y || 0])

      const dx = x - width / 2
      const dy = y - height / 2

      console.log(dx, dy)

      setOffset([offset[0] - dx / transform.k, offset[1] - dy / transform.k])
    },
    [transform, width, height, offset],
  )

  return { transform, scrollIntoView, centerInView }
}

/**
 * Get the cursor position relative to the target of the mouse event,
 * taking into account the current zoom transform.
 */
function getRelativePosition(event: React.MouseEvent, transform: ZoomTransform): Position {
  const rect = event.currentTarget.getBoundingClientRect()

  const [x, y] = transform.invert([event.clientX - rect.left, event.clientY - rect.top])

  return { x, y }
}

/**
 * Get the node closest to the given position,
 * or null if none are within the given radius.
 */
function getClosestNode(nodes: Node[], position: Position, radius: number): Node | null {
  const [node] = nodes.reduce<[Node | null, number]>(
    (acc, node) => {
      let [closestNode, minDistance] = acc

      if (!node.x || !node.y) return acc

      const distance = getDistance({ x: node.x, y: node.y }, position)

      // If the node is closer than the current closest node,
      // then it's the new closest node.
      if (distance < minDistance) {
        closestNode = node
        minDistance = distance
      }

      return [closestNode, minDistance]
    },
    [null, radius],
  )

  return node
}

/** Get the next node in the given direction. */
function getNextNode(nodes: Node[], selectedId: string, direction: Direction): Node | null {
  const selectedNode = nodes.find((node) => node.id === selectedId)

  if (!selectedNode || selectedNode.x === undefined || selectedNode.y === undefined) {
    return null
  }

  let result: { node: Node; score: number } | undefined

  for (const node of nodes) {
    // Skip selected node
    if (node === selectedNode) continue

    // Skip nodes without position
    if (node.x === undefined || node.y === undefined) continue

    // Skip nodes on the wrong side of the selected node
    if (direction === "up" && node.y > selectedNode.y) continue
    if (direction === "down" && node.y < selectedNode.y) continue
    if (direction === "left" && node.x > selectedNode.x) continue
    if (direction === "right" && node.x < selectedNode.x) continue

    // Get the distance between the current node and the selected node
    const distance = getDistance({ x: node.x, y: node.y }, { x: selectedNode.x, y: selectedNode.y })

    // Get the angle between the current node and the selected node
    const angle = getAngle(
      { x: node.x, y: node.y },
      { x: selectedNode.x, y: selectedNode.y },
      DIRERCTION_TO_AXIS[direction],
    )

    // Calculate a score for the current node
    const score = (1 / distance) * Math.pow((Math.PI / 2 - angle) / (Math.PI / 2), 2)

    // Pick the node with the highest score
    if (!result || result.score < score) {
      result = { node, score }
    }
  }

  return result?.node || null
}

/** Get the distance between two positions. */
function getDistance(a: Position, b: Position) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Get the angle between two positions in radians. */
function getAngle(a: Position, b: Position, axis: Axis) {
  const dx = Math.abs(b.x - a.x)
  const dy = Math.abs(b.y - a.y)

  if (axis === "x") {
    return Math.atan2(dy, dx)
  } else {
    return Math.atan2(dx, dy)
  }
}
