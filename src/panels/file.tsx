import React from "react"
import { FilePreview } from "../components/file-preview"
import { NoteIcon24 } from "../components/icons"
import { Panel } from "../components/panel"
import { PanelContext, PanelProps } from "../components/panels"

export function FilePanel({ id, params = {}, onClose }: PanelProps) {
  const { search } = React.useContext(PanelContext) || {}
  const path = new URLSearchParams(search).get("path") || ""

  return (
    // TODO: Create 24px file icon
    <Panel id={id} title="File" icon={<NoteIcon24 />} onClose={onClose}>
      <FilePreview path={path} />
    </Panel>
  )
}
