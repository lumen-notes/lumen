import { useActor } from "@xstate/react"
import Graph from "graphology"
import React from "react"
import { useMeasure } from "react-use"
import { z } from "zod"
import { DrawLinkOptions, DrawNodeOptions, NetworkGraph, Node } from "../components/network-graph"
import { NoteCard } from "../components/note-card"
import { GlobalStateContext } from "../global-state"
import { useSearchParam } from "../utils/use-search-param"

export function GraphPage() {
  const [selectedId, setSelectedId] = useSearchParam("id", {
    defaultValue: "",
    schema: z.string(),
    replace: true,
  })

  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)

  const { nodes, links } = React.useMemo(() => {
    // TODO: Store the graph in the global context
    // TODO: Add tags and dates to the graph
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

  const [ref, { width, height }] = useMeasure<HTMLDivElement>()

  const drawNode = React.useCallback(
    ({ node, context, cssVar }: DrawNodeOptions) => {
      const isSelected = node.id === selectedId
      const nodeRadius = isSelected ? 6 : 4

      // Draw a circle
      context.beginPath()
      context.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2)
      if (!selectedId) {
        context.fillStyle = cssVar("--color-text")
      } else if (node.id === selectedId) {
        context.fillStyle = cssVar("--color-text")
      } else {
        context.fillStyle = cssVar("--color-text-placeholder")
      }
      context.fill()
    },
    [selectedId],
  )

  const drawLink = React.useCallback(
    ({ link, context, cssVar }: DrawLinkOptions) => {
      // Draw a line
      context.beginPath()
      context.moveTo(link.source.x, link.source.y)
      context.lineTo(link.target.x, link.target.y)
      context.strokeStyle = selectedId ? cssVar("--color-border-divider") : cssVar("--color-border")
      context.lineWidth = 1
      context.stroke()
    },
    [selectedId],
  )

  const bringToFront = React.useCallback(
    (node: Node) => {
      return node.id === selectedId
    },
    [selectedId],
  )

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">
      {selectedId ? (
        <div className="absolute bottom-0 right-0 w-full max-w-md p-4">
          <NoteCard id={selectedId} />
        </div>
      ) : null}
      <NetworkGraph
        width={width}
        height={height}
        nodes={nodes}
        links={links}
        drawNode={drawNode}
        drawLink={drawLink}
        bringToFront={bringToFront}
        onClick={(node) => {
          setSelectedId(node?.id || "")
        }}
      />
    </div>
  )
}
