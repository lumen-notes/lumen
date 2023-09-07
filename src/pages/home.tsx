import ReactFlow, { Background, Controls } from "reactflow"
import "reactflow/dist/style.css"

const nodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "Node 1" },
  },
]

export function HomePage() {
  return (
    <div className="h-full">
      <ReactFlow nodes={nodes} proOptions={{ hideAttribution: true }}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
