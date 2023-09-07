import React from "react"
import ReactFlow, { Background, Controls, NodeProps } from "reactflow"
import "reactflow/dist/style.css"
import { NoteCard } from "../components/note-card"
import { NoteId } from "../types"

const nodes = [
  {
    id: "1",
    type: "note",
    position: { x: 0, y: 0 },
    data: { noteId: "1694032625739" },
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

  return (
    <div className="h-full">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
