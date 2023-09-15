import { atom, useAtom, useSetAtom } from "jotai"
import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import ReactFlow, {
  Background,
  Controls,
  // MiniMap,
  Node,
  NodeProps,
  NodeResizeControl,
  OnNodesChange,
  ReactFlowInstance,
  Panel as ReactFlowPanel,
  ResizeControlVariant,
  SelectionMode,
  applyNodeChanges,
} from "reactflow"
import "reactflow/dist/base.css"
import { z } from "zod"
import { Card } from "../components/card"
import { IconButton } from "../components/icon-button"
import {
  ChevronLeftIcon16,
  ChevronRightIcon16,
  NoteIcon16,
  SidebarIcon16,
} from "../components/icons"
import { NoteCard } from "../components/note-card"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { NoteId } from "../types"
import { cx } from "../utils/cx"

const nodesAtom = atom<Node[]>([])

const resizeControlStyle = {
  background: "transparent",
  border: "none",
  width: 8,
}

const NoteNode = React.memo(({ data, selected }: NodeProps<{ noteId: NoteId }>) => {
  return (
    <>
      <div className="w-full">
        <NoteCard id={data.noteId} selected={selected} />
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
})

const NewNoteNode = React.memo(({ id, selected }: NodeProps) => {
  const setNodes = useSetAtom(nodesAtom)
  return (
    <>
      <div className="w-full">
        <NoteCardForm
          minHeight="16rem"
          maxHeight="50vh"
          selected={selected}
          onSubmit={({ id: noteId }) => {
            setNodes((nodes) =>
              nodes.map((node) =>
                node.id === id ? { ...node, type: "note", data: { noteId } } : node,
              ),
            )
          }}
          onCancel={() => {
            setNodes((nodes) => nodes.filter((node) => node.id !== id))
          }}
        />
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
})

const nodeTypes = { note: NoteNode, newNote: NewNoteNode }

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(["note", "newNote"]),
  position: z.object({ x: z.number(), y: z.number() }),
  style: z.record(z.unknown()).optional(),
  data: z.record(z.unknown()),
})

const panOnDrag = [1, 2]

export function attachNodeData(event: React.DragEvent, node: Zod.infer<typeof nodeSchema>) {
  event.dataTransfer.setData("application/reactflow", JSON.stringify(node))
  event.dataTransfer.effectAllowed = "move"
}

export function HomePage() {
  const reactFlowContainer = React.useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null)
  const [nodes, setNodes] = useAtom(nodesAtom)
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(true)

  const onNodesChange: OnNodesChange = React.useCallback(
    (changes) => setNodes((n) => applyNodeChanges(changes, n)),
    [setNodes],
  )

  const onDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      if (!reactFlowInstance || !reactFlowContainer.current) return

      const reactFlowRect = reactFlowContainer.current?.getBoundingClientRect()

      const data = event.dataTransfer.getData("application/reactflow")
      const node = nodeSchema.parse(JSON.parse(data))

      const offset = reactFlowInstance.project({
        x: event.clientX - reactFlowRect.left,
        y: event.clientY - reactFlowRect.top,
      })

      const position = {
        x: offset.x + node.position.x,
        y: offset.y + node.position.y,
      }

      setNodes((nodes) => [
        // De-select all nodes
        ...nodes.map((node) => ({ ...node, selected: false })),
        {
          ...node,
          position,
          // Select the new node
          selected: true,
        },
      ])
    },
    [reactFlowInstance, setNodes],
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
              {!isSidebarExpanded ? (
                <ReactFlowPanel position="top-right" style={{ margin: 8 }}>
                  <Card className="rounded-sm">
                    <IconButton
                      aria-label="Expand sidebar"
                      aria-expanded={false}
                      onClick={() => setIsSidebarExpanded(true)}
                      className="p-[calc(0.5rem-1px)]"
                    >
                      <SidebarIcon16 />
                    </IconButton>
                  </Card>
                </ReactFlowPanel>
              ) : null}
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
        {isSidebarExpanded ? (
          <>
            <PanelResizeHandle className="group relative z-20 -mx-0.5 px-0.5 hover:bg-border-secondary data-[resize-handle-active]:bg-border-focus">
              <div className="h-full w-px bg-border-secondary group-hover:opacity-0 group-data-[resize-handle-active]:opacity-0" />
            </PanelResizeHandle>
            <Panel minSize={30} maxSize={50} defaultSize={40} style={{ overflow: "auto" }}>
              <div
                className={cx(
                  "sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-border-secondary bg-gradient-to-b from-bg-inset to-bg-inset-backdrop p-2 backdrop-blur-md",
                )}
              >
                <div className="flex flex-shrink items-center gap-4">
                  <div className="flex">
                    <IconButton
                      aria-label="Back"
                      disabled
                      // onClick={() => navigate(-1)}
                      // shortcut={["⌘", "["]}
                      // TODO: Disable when at the beginning of history
                    >
                      <ChevronLeftIcon16 />
                    </IconButton>
                    <IconButton
                      aria-label="Forward"
                      disabled
                      // onClick={() => navigate(1)}
                      // shortcut={["⌘", "]"]}
                      // TODO: Disable when at the end of history
                    >
                      <ChevronRightIcon16 />
                    </IconButton>
                  </div>
                  <div className="flex flex-shrink items-center gap-2">
                    <div className="flex-shrink-0 text-text-secondary">
                      <NoteIcon16 />
                    </div>
                    <div className="flex items-baseline gap-3 overflow-hidden">
                      <h2 className="flex-shrink-0 text-lg font-semibold leading-4">Notes</h2>
                    </div>
                  </div>
                </div>
                <IconButton
                  aria-label="Collapse sidebar"
                  aria-expanded={true}
                  onClick={() => setIsSidebarExpanded(false)}
                >
                  <SidebarIcon16 />
                </IconButton>
              </div>
              <div className="p-4">
                <NoteList />
              </div>
            </Panel>
          </>
        ) : null}
      </PanelGroup>
    </div>
  )
}
