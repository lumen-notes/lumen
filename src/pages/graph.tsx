import { useActor } from "@xstate/react"
import Graph from "graphology"
import React from "react"
import { NetworkGraph } from "../components/network-graph"
import { GlobalStateContext } from "../global-state"
import { useMeasure } from "react-use"

export function GraphPage() {
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

  return (
    <div ref={ref} className="h-full w-full overflow-hidden">
      <NetworkGraph
        nodes={nodes}
        links={links}
        width={width}
        height={height}
        onNodeClick={(node) => console.log(node.id)}
      />
    </div>
  )
}
