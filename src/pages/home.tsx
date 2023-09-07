import React from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  NodeProps,
  OnNodesChange,
  SelectionMode,
  applyNodeChanges,
} from "reactflow"
import "reactflow/dist/base.css"
import { NoteCard } from "../components/note-card"
import { NoteId } from "../types"

const initialNodes = [
  {
    id: "1",
    type: "note",
    position: { x: 0, y: 0 },
    data: { noteId: "1694032625739" },
  },
  {
    id: "2",
    type: "note",
    position: { x: 800, y: 400 },
    data: { noteId: "1652342106359" },
  },
]

function NoteNode({ data }: NodeProps<{ noteId: NoteId }>) {
  return (
    <div className="w-[500px]">
      <NoteCard id={data.noteId} />
    </div>
  )
}

export function HomePage() {
  const nodeTypes = React.useMemo(() => ({ note: NoteNode }), [])

  const [nodes, setNodes] = React.useState<Node[]>(initialNodes)

  const onNodesChange: OnNodesChange = React.useCallback(
    (changes) => setNodes((n) => applyNodeChanges(changes, n)),
    [],
  )

  return (
    <div className="h-full">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        onNodesChange={onNodesChange}
        selectionMode={SelectionMode.Partial}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--color-text-tertiary)" />
        <Controls />
        <MiniMap
          ariaLabel="Mini map"
          pannable
          zoomable
          className="overflow-hidden rounded-md border border-transparent !bg-bg-overlay shadow-md ring-1 ring-border-secondary dark:border-border-secondary dark:ring-[rgba(0,0,0,0.6)] [&_.react-flow\_\_minimap-mask]:opacity-0 [&_.react-flow\_\_minimap-mask]:transition-opacity [&_.react-flow\_\_minimap-mask]:hover:opacity-100"
          maskColor="var(--color-bg-secondary)"
          nodeColor="var(--color-bg-tertiary)"
        />
      </ReactFlow>
    </div>
  )
}
