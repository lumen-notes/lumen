import React from "react"
import ReactFlow, {
  Background,
  Controls,
  Node,
  NodeProps,
  OnNodesChange,
  SelectionMode,
  applyNodeChanges,
} from "reactflow"
import "reactflow/dist/style.css"
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
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
