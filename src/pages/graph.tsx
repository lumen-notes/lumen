import { useActor } from "@xstate/react"
import Graph from "graphology"
import React from "react"
import { Link as RouterLink, LinkProps } from "react-router-dom"
import { useMeasure } from "react-use"
import { z } from "zod"
import { LinkContext } from "../components/link-context"
import { NetworkGraph, NetworkGraphInstance } from "../components/network-graph"
import { NoteCard } from "../components/note-card"
import { GlobalStateContext } from "../global-state"
import { useSearchParam } from "../utils/use-search-param"

const GraphContext = React.createContext({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  selectNode: (nodeId: string) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  hoverNode: (nodeId: string) => {},
})

export function GraphPage() {
  const [selectedId, setSelectedId] = useSearchParam("id", {
    defaultValue: "",
    schema: z.string(),
    replace: true,
  })
  const [hoveredId, setHoveredId] = React.useState<string>("")

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

  const graphRef = React.useRef<NetworkGraphInstance>(null)

  const selectNode = React.useCallback(
    (id: string) => {
      setSelectedId(id)
      graphRef.current?.focus()
    },
    [setSelectedId],
  )

  const contextValue = React.useMemo(
    () => ({ selectNode, hoverNode: setHoveredId }),
    [selectNode, setHoveredId],
  )

  return (
    <GraphContext.Provider value={contextValue}>
      <LinkContext.Provider value={Link}>
        <div ref={ref} className="relative h-full w-full overflow-hidden">
          <NetworkGraph
            ref={graphRef}
            width={width}
            height={height}
            nodes={nodes}
            links={links}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={(node) => setSelectedId(node?.id || "")}
            onHover={(node) => setHoveredId(node?.id || "")}
          />
          {selectedId ? (
            <div className="absolute bottom-0 right-0 max-h-full w-full max-w-md overflow-auto p-4">
              <NoteCard id={selectedId} />
            </div>
          ) : null}
        </div>
      </LinkContext.Provider>
    </GraphContext.Provider>
  )
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { selectNode, hoverNode } = React.useContext(GraphContext)
  return (
    <RouterLink
      {...props}
      ref={ref}
      onClick={(event) => {
        if (typeof props.to !== "string" || event.metaKey || event.ctrlKey || event.shiftKey) {
          return
        }

        // Note link
        if (props.to.match(/^\/\d+$/)) {
          const id = props.to.replace(/^\//, "")
          selectNode(id)
          event.preventDefault()
        }
      }}
      onMouseEnter={(event) => {
        if (typeof props.to !== "string") return

        // Note link
        if (props.to.match(/^\/\d+$/)) {
          const id = props.to.replace(/^\//, "")
          hoverNode(id)
          event.preventDefault()
        }
      }}
      onMouseLeave={() => hoverNode("")}
    />
  )
})
