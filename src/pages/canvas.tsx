import { useAtom, useSetAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import React from "react"
import { ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import ReactFlow, {
  Background,
  Node,
  NodeProps,
  NodeResizeControl,
  OnNodesChange,
  ReactFlowInstance,
  Panel as ReactFlowPanel,
  ResizeControlVariant,
  SelectionMode,
  applyNodeChanges,
  useReactFlow,
  useViewport,
} from "reactflow"
import "reactflow/dist/base.css"
import { z } from "zod"
import { Card } from "../components/card"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import { MinusIcon16, NoteIcon16, PlusIcon16, SidebarIcon16 } from "../components/icons"
import { NoteCard } from "../components/note-card"
import { NoteCardForm } from "../components/note-card-form"
import { NoteList } from "../components/note-list"
import { NoteId } from "../types"
import { cx } from "../utils/cx"

// TODO: Store in a file
const nodesAtom = atomWithStorage<Node[]>("canvas_nodes", [])

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

export function CanvasPage() {
  const reactFlowContainer = React.useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null)
  const [nodes, setNodes] = useAtom(nodesAtom)
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(true)
  const sidebarRef = React.useRef<ImperativePanelHandle>(null)

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
      <PanelGroup direction="horizontal" units="pixels">
        <Panel minSize={400}>
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
              <ReactFlowPanel position="bottom-left" style={{ margin: 8 }}>
                <ZoomControls />
              </ReactFlowPanel>
              {!isSidebarExpanded ? (
                <ReactFlowPanel position="top-right" style={{ margin: 8 }}>
                  <Card className="rounded-sm after:rounded-sm">
                    <IconButton
                      aria-label="Expand sidebar"
                      aria-expanded={false}
                      onClick={() => sidebarRef.current?.expand()}
                    >
                      <SidebarIcon16 />
                    </IconButton>
                  </Card>
                </ReactFlowPanel>
              ) : null}
            </ReactFlow>
          </div>
        </Panel>
        <PanelResizeHandle className="group relative z-20 -mx-0.5 px-0.5 hover:bg-border-secondary data-[resize-handle-active]:bg-border-focus">
          <div
            className={cx(
              "h-full w-px group-hover:opacity-0 group-data-[resize-handle-active]:opacity-0",
              isSidebarExpanded ? "bg-border-secondary" : "bg-transparent",
            )}
          />
        </PanelResizeHandle>
        <Panel
          ref={sidebarRef}
          minSize={400}
          maxSize={800}
          defaultSize={560}
          style={{ overflow: "auto" }}
          collapsible
          onCollapse={(collapsed) => setIsSidebarExpanded(!collapsed)}
        >
          <div
            className={cx(
              "sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-border-secondary bg-gradient-to-b from-bg-inset to-bg-inset-backdrop p-2 pl-4 backdrop-blur-md",
            )}
          >
            <div className="flex flex-shrink items-center gap-4">
              {/* <div className="flex">
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
                  </div> */}
              <div className="flex flex-shrink items-center gap-3">
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
              onClick={() => sidebarRef.current?.collapse()}
            >
              <SidebarIcon16 />
            </IconButton>
          </div>
          <div className="p-4">
            <NoteList />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}

function ZoomControls() {
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow()
  const { zoom } = useViewport()
  return (
    <Card className="flex rounded-sm after:rounded-sm [&_button:first-child]:rounded-l-sm [&_button:last-child]:rounded-r-sm [&_button]:rounded-none">
      <IconButton
        aria-label="Zoom out"
        // shortcut={["⌘", "-"]}
        onClick={() => zoomOut()}
      >
        <MinusIcon16 />
      </IconButton>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <button className="focus-ring inline-block p-2 leading-4 hover:bg-bg-secondary">
            {Math.round(zoom * 100)}%
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="center" minWidth="8rem">
          <DropdownMenu.Item onSelect={() => fitView({ padding: 0.1 })}>
            Zoom to fit
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => zoomTo(1)}>Zoom to 100%</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
      <IconButton
        aria-label="Zoom in"
        onClick={() => zoomIn()}
        // shortcut={["⌘", "="]}
      >
        <PlusIcon16 />
      </IconButton>
    </Card>
  )
}
