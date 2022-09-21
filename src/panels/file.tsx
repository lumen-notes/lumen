import React from "react"
import { FilePreview } from "../components/file-preview"
import { FileIcon24 } from "../components/icons"
import { Panel } from "../components/panel"
import { PanelContext, PanelProps } from "../components/panels"

export function FilePanel({ id, onClose }: PanelProps) {
  const { search } = React.useContext(PanelContext) || {}
  const path = new URLSearchParams(search).get("path") || ""

  return (
    <Panel
      id={id}
      title="File"
      description={path.split("/").pop()}
      icon={<FileIcon24 />}
      onClose={onClose}
    >
      <div className="grid h-full w-full place-items-center">
        <FilePreview path={path} />
      </div>
    </Panel>
  )
}
