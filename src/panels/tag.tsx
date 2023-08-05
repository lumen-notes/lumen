import React from "react"
import { useLocation } from "react-router-dom"
import { Button } from "../components/button"
import { Card } from "../components/card"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import {
  CloseIcon16,
  EditIcon16,
  ExternalLinkIcon16,
  TagIcon24,
  TrashIcon16,
} from "../components/icons"
import { Input } from "../components/input"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelContext, PanelProps, PanelsContext } from "../components/panels"
import { useDeleteTag, useRenameTag } from "../utils/github-sync"
import { openNewWindow } from "../utils/open-new-window"

export function TagPanel({ id, params = {}, onClose }: PanelProps) {
  const { "*": name = "" } = params
  const renameTag = useRenameTag()
  const deleteTag = useDeleteTag()
  const { updatePanel } = React.useContext(PanelsContext)
  const panel = React.useContext(PanelContext)
  const location = useLocation()
  const [isRenaming, setIsRenaming] = React.useState(false)
  const nameInputRef = React.useRef<HTMLInputElement>(null)

  const openRenameForm = React.useCallback(() => setIsRenaming(true), [])

  const closeRenameForm = React.useCallback(() => setIsRenaming(false), [])

  const handleDeleteTag = React.useCallback(() => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete the "${name}" tag?`)) {
      return
    }

    // Close the current tag panel
    onClose?.()

    // Update state
    deleteTag(name)
  }, [onClose, deleteTag, name])

  return (
    <Panel
      id={id}
      title={name}
      icon={<TagIcon24 />}
      actions={
        <>
          <DropdownMenu.Item
            icon={<ExternalLinkIcon16 />}
            onSelect={() => {
              const url = panel
                ? `${panel.pathname}?${panel.search}`
                : `${location.pathname}?${location.search}`
              openNewWindow(url)
            }}
          >
            Open in new window
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item icon={<EditIcon16 />} disabled={isRenaming} onSelect={openRenameForm}>
            Rename tag
          </DropdownMenu.Item>
          <DropdownMenu.Item icon={<TrashIcon16 />} variant="danger" onSelect={handleDeleteTag}>
            Delete tag
          </DropdownMenu.Item>
        </>
      }
      onClose={onClose}
    >
      <LinkHighlightProvider href={`/tags/${name}`}>
        <div className="p-4">
          {isRenaming ? (
            <Card className="mb-4 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 id="rename-tag-heading" className="text-xl font-semibold leading-4">
                  Rename tag
                </h3>
                <IconButton aria-label="Close" className="-m-2" onClick={closeRenameForm}>
                  <CloseIcon16 />
                </IconButton>
              </div>
              <form
                aria-labelledby="rename-tag-heading"
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  const formData = new FormData(event.currentTarget)
                  const newName = String(formData.get("name"))

                  renameTag(name, newName)
                  closeRenameForm()

                  if (panel) {
                    updatePanel?.(panel.index, { pathname: `/tags/${newName}` })
                  }
                }}
              >
                <label htmlFor="name" className="sr-only">
                  Name
                </label>
                <div className="flex  gap-2">
                  <Input
                    ref={nameInputRef}
                    id="name"
                    name="name"
                    defaultValue={name}
                    title="Tag names must start with a letter and can contain letters, numbers, hyphens, underscores, and forward slashes."
                    pattern="^[a-zA-Z][a-zA-Z0-9\-_\/]*$"
                    required
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        closeRenameForm()
                      }
                    }}
                  />
                  <Button type="submit" variant="primary" className="!h-full">
                    Save
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}
          <NoteList key={name} baseQuery={`tag:${name}`} />
        </div>
      </LinkHighlightProvider>
    </Panel>
  )
}
