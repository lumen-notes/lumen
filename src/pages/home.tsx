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
import { NoteCardForm } from "../components/note-card-form"
import { NoteId } from "../types"

const initialNodes = [
  {
    id: "1",
    type: "note",
    position: { x: 0, y: 0 },
    style: { width: 500 },
    data: { noteId: "1694032625739" },
  },
  {
    id: "2",
    type: "note",
    position: { x: 800, y: 400 },
    style: { width: 500 },
    data: { noteId: "1652342106359" },
  },
  {
    id: "3",
    type: "newNote",
    position: { x: 800, y: 0 },
    style: { width: 500 },
    data: {},
  },
]

const resizeControlStyle = {
  background: "transparent",
  border: "none",
  width: 8,
}

function NoteNode({ data }: NodeProps<{ noteId: NoteId }>) {
  return (
    <>
      <div className="w-full">
        <NoteCard id={data.noteId} />
      </div>
      <NodeResizeControl
        position="right"
        variant={ResizeControlVariant.Line}
        style={resizeControlStyle}
      />
      <NodeResizeControl
        position="left"
        variant={ResizeControlVariant.Line}
        style={resizeControlStyle}
      />
    </>
  )
}

function NewNoteNode() {
  return (
    <>
      <div className="w-full">
        <NoteCardForm minHeight="16rem" maxHeight="50vh" />
      </div>
      <NodeResizeControl
        position="right"
        variant={ResizeControlVariant.Line}
        style={resizeControlStyle}
      />
      <NodeResizeControl
        position="left"
        variant={ResizeControlVariant.Line}
        style={resizeControlStyle}
      />
    </>
  )
}

const panOnDrag = [1, 2]

export function HomePage() {
  const reactFlowContainer = React.useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null)

  const nodeTypes = React.useMemo(() => ({ note: NoteNode, newNote: NewNoteNode }), [])

  const [nodes, setNodes] = React.useState<Node[]>(initialNodes)

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
      <div ref={reactFlowContainer}>
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
      <div className="w-[24rem] border-l border-border-secondary p-4">
        <NoteCard id="1652342106359" />
      </div>
    </div>
  )
}
