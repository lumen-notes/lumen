import React from "react"
import { Button } from "../components/button"
import { Card } from "../components/card"
import { DropdownMenu } from "../components/dropdown-menu"
import { EditIcon16, TagIcon16, TrashIcon16 } from "../components/icons"
import { TextInput } from "../components/text-input"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelProps, usePanel, usePanelActions } from "../components/panels"
import { useDeleteTag, useRenameTag } from "../hooks/tag"

export function TagPanel({ id, params = {}, onClose }: PanelProps) {
  const { "*": name = "" } = params
  const renameTag = useRenameTag()
  const deleteTag = useDeleteTag()
  const { updatePanel } = usePanelActions()
  const panel = usePanel()
  const [isRenaming, setIsRenaming] = React.useState(false)
  const nameInputRef = React.useRef<HTMLInputElement>(null)

  const openRenameForm = React.useCallback(() => setIsRenaming(true), [])

  const closeRenameForm = React.useCallback(() => setIsRenaming(false), [])

  const handleDeleteTag = React.useCallback(() => {
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete the "${name}" tag?`)) {
      deleteTag(name)

      // Close the current tag panel
      onClose?.()
    }
  }, [onClose, deleteTag, name])

  return (
    <Panel
      id={id}
      title={name}
      icon={<TagIcon16 />}
      actions={
        <>
          <DropdownMenu.Item icon={<EditIcon16 />} onSelect={openRenameForm}>
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
        <div className="container p-4">
          {isRenaming ? (
            <Card className="mb-4 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 id="rename-tag-heading" className="text-lg font-semibold leading-4">
                  Rename tag
                </h3>
              </div>
              <form
                aria-labelledby="rename-tag-heading"
                className="flex flex-col items-end gap-4"
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
                <div className="flex w-full gap-2">
                  <TextInput
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
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={closeRenameForm}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
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
