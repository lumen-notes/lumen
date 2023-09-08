import React from "react"
import ReactFlow, {
  Background,
  Controls,
  // MiniMap,
  Node,
  NodeProps,
  NodeResizeControl,
  OnNodesChange,
  ReactFlowInstance,
  ResizeControlVariant,
  SelectionMode,
  applyNodeChanges,
} from "reactflow"
import "reactflow/dist/base.css"
import { z } from "zod"
import { NoteCard } from "../components/note-card"
import { NoteList } from "../components/note-list"
import { NoteId } from "../types"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

const resizeControlStyle = {
  background: "transparent",
  border: "none",
  width: 8,
}

function _NoteNode({ data }: NodeProps<{ noteId: NoteId }>) {
  return (
    <>
      <div className="w-full">
        <NoteCard id={data.noteId} />
      </div>
      <NodeResizeControl
        position="right"
        variant={ResizeControlVariant.Line}
        style={resizeControlStyle}
        minWidth={200}
      />
      <NodeResizeControl
        position="left"
        variant={ResizeControlVariant.Line}
        style={resizeControlStyle}
        minWidth={200}
      />
    </>
  )
}

const NoteNode = React.memo(_NoteNode)

const panOnDrag = [1, 2]

export function HomePage() {
  const reactFlowContainer = React.useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null)

  const nodeTypes = React.useMemo(() => ({ note: NoteNode }), [])

  const [nodes, setNodes] = React.useState<Node[]>([])

  const onNodesChange: OnNodesChange = React.useCallback(
    (changes) => setNodes((n) => applyNodeChanges(changes, n)),
    [],
  )

  const onDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      if (!reactFlowInstance || !reactFlowContainer.current) return

      const reactFlowRect = reactFlowContainer.current?.getBoundingClientRect()

      const dataSchema = z.object({
        type: z.literal("note"),
        position: z.object({ x: z.number(), y: z.number() }),
        style: z.object({ width: z.number() }),
        data: z.object({ noteId: z.string() }),
      })
      const data = event.dataTransfer.getData("application/reactflow")
      const parsedData = dataSchema.parse(JSON.parse(data))

      const id = window.crypto.randomUUID()

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowRect.left,
        y: event.clientY - reactFlowRect.top,
      })

      const node = {
        ...parsedData,
        id,
        position: {
          x: position.x + parsedData.position.x,
          y: position.y + parsedData.position.y,
        },
      }

      setNodes((n) => [...n, node])
    },
    [reactFlowInstance],
  )

  const onDragOver = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  return (
    <div className="grid h-full grid-cols-[1fr_auto]">
      <PanelGroup direction="horizontal">
        <Panel>
          <div className="h-full w-full" ref={reactFlowContainer}>
            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={nodes}
              panOnScroll
              selectionOnDrag
              panOnDrag={panOnDrag}
              selectionMode={SelectionMode.Partial}
              proOptions={{ hideAttribution: true }}
              onInit={setReactFlowInstance}
              onNodesChange={onNodesChange}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <Background color="var(--color-border-secondary)" gap={16} size={2} />
              <Controls />
              {/* <MiniMap
          ariaLabel="Mini map"
          pannable
          zoomable
          className="overflow-hidden rounded-md border border-transparent !bg-bg-overlay shadow-md ring-1 ring-border-secondary dark:border-border-secondary dark:ring-[rgba(0,0,0,0.6)] [&_.react-flow\_\_minimap-mask]:opacity-0 [&_.react-flow\_\_minimap-mask]:transition-opacity [&_.react-flow\_\_minimap-mask]:hover:opacity-100"
          maskColor="var(--color-bg-secondary)"
          nodeColor="var(--color-bg-tertiary)"
        /> */}
            </ReactFlow>
          </div>
        </Panel>
        <PanelResizeHandle className="group relative -mx-0.5 px-0.5 hover:bg-border-secondary data-[resize-handle-active]:bg-border-focus">
          <div className="h-full w-px bg-border-secondary group-hover:hidden group-data-[resize-handle-active]:hidden" />
        </PanelResizeHandle>
        <Panel minSize={30} maxSize={50} defaultSize={40} style={{ overflow: "auto" }}>
          <div className="p-4">
            <NoteList />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
