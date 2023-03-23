import Graph from "graphology"
import React from "react"
import { Link, Node } from "../force-simulation.worker"
import { GlobalStateContext } from "../global-state.machine"
import { formatDate } from "./date"

type NodeAttributes = {
  type: "note" | "tag" | "date"
  title: string
}

export function useGlobalGraph() {
  const [state] = GlobalStateContext.useActor()

  return React.useMemo(() => {
    const globalGraph = new Graph<NodeAttributes>({
      type: "undirected",
      multi: false,
    })

    // Add notes to the graph
    for (const [noteId, { title }] of Object.entries(state.context.notes)) {
      globalGraph.addNode(noteId, { type: "note", title })
    }

    // Add edges between notes
    for (const [noteId, note] of Object.entries(state.context.notes)) {
      if (!globalGraph.hasNode(noteId)) continue

      for (const backlink of note.backlinks) {
        if (!globalGraph.hasNode(backlink) || globalGraph.hasEdge(backlink, noteId)) continue

        globalGraph.addEdge(backlink, noteId)
      }
    }

    // Add tags to graph
    for (const [tagName, noteIds] of Object.entries(state.context.tags)) {
      globalGraph.addNode(tagName, { type: "tag", title: `#${tagName}` })

      for (const noteId of noteIds) {
        if (!globalGraph.hasNode(noteId) || globalGraph.hasEdge(tagName, noteId)) continue

        globalGraph.addEdge(tagName, noteId)
      }
    }

    // Add dates to graph
    for (const [date, noteIds] of Object.entries(state.context.dates)) {
      globalGraph.addNode(date, { type: "date", title: formatDate(date) })

      for (const noteId of noteIds) {
        if (!globalGraph.hasNode(noteId) || globalGraph.hasEdge(date, noteId)) continue

        globalGraph.addEdge(date, noteId)
      }
    }

    return globalGraph
  }, [state.context.notes, state.context.tags, state.context.dates])
}

export function useLocalGraph(nodeId: string) {
  const globalGraph = useGlobalGraph()

  return React.useMemo(() => {
    const localGraph = new Graph<NodeAttributes>({
      type: "undirected",
      multi: false,
    })

    const nodeAttrs = globalGraph.getNodeAttributes(nodeId)

    if (!nodeAttrs) return localGraph

    localGraph.addNode(nodeId, nodeAttrs)

    // Copy neighbors from global graph to local graph
    globalGraph.forEachNeighbor(nodeId, (neighborId, neighborAttrs) => {
      localGraph.addNode(neighborId, neighborAttrs)
    })

    // Copy edges from global graph to local graph
    localGraph.forEachNode((nodeId) => {
      globalGraph.forEachNeighbor(nodeId, (neighborId) => {
        if (!localGraph.hasNode(neighborId) || localGraph.hasEdge(nodeId, neighborId)) return
        localGraph.addEdge(nodeId, neighborId)
      })
    })

    return localGraph
  }, [globalGraph, nodeId])
}

export function getNodes(graph: Graph<NodeAttributes>): Node[] {
  return graph.mapNodes((id, { title }) => ({ id, title }))
}

export function getLinks(graph: Graph<NodeAttributes>): Link[] {
  return graph.mapEdges((edge, attributes, source, target) => ({ source, target }))
}
