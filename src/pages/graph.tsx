import { useActor } from "@xstate/react"
import Graph from "graphology"
import React from "react"
import { useMeasure } from "react-use"
import { z } from "zod"
import { Link, NetworkGraph, Node } from "../components/network-graph"
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

  const nodeColor = React.useCallback(
    (node: Node, cssVar: (name: string) => string) => {
      if (!selectedId) {
        return cssVar("--color-text")
      }

      return node.id === selectedId ? cssVar("--color-text") : cssVar("--color-text-placeholder")
    },
    [selectedId],
  )

  const linkColor = React.useCallback(
    (link: Link, cssVar: (name: string) => string) => {
      return selectedId ? cssVar("--color-border-divider") : cssVar("--color-border")
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
        nodeColor={nodeColor}
        linkColor={linkColor}
        // drawNode={drawNode}
        // drawLink={drawLink}
        onClick={(node) => {
          setSelectedId(node?.id || "")
        }}
      />
    </div>
  )
}
