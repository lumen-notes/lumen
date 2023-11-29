import { FilePreview } from "../components/file-preview"
import { FileIcon16 } from "../components/icons"
import { Panel } from "../components/panel"
import { PanelProps, usePanel } from "../components/panels"

export function FilePanel({ id, onClose }: PanelProps) {
  const { search } = usePanel() || {}
  const path = new URLSearchParams(search).get("path") || ""

  return (
    <Panel
      id={id}
      title="File"
      description={path.split("/").pop()}
      icon={<FileIcon16 />}
      onClose={onClose}
    >
      <div className="grid h-full w-full place-items-center">
        <FilePreview path={path} />
      </div>
    </Panel>
  )
}
