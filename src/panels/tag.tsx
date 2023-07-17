import React from "react"
import { Button } from "../components/button"
import { Card } from "../components/card"
import { EditIcon16, ExternalLinkIcon16, TagIcon24, TrashIcon16 } from "../components/icons"
import { Input } from "../components/input"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelContext, PanelProps, PanelsContext } from "../components/panels"
import { useRenameTag } from "../utils/github-sync"
import { DropdownMenu } from "../components/dropdown-menu"

export function TagPanel({ id, params = {}, onClose }: PanelProps) {
  const { "*": name = "" } = params
  const renameTag = useRenameTag()
  const { updatePanel } = React.useContext(PanelsContext)
  const panel = React.useContext(PanelContext)
  const [isRenaming, setIsRenaming] = React.useState(false)
  const nameInputRef = React.useRef<HTMLInputElement>(null)

  const openRenameForm = React.useCallback(() => setIsRenaming(true), [])

  const closeRenameForm = React.useCallback(() => setIsRenaming(false), [])

  const openTagWindow = React.useCallback((name: string) => {
    const newWindowWidth = 600
    const newWindowHeight = 600
    window.open(
      // TODO: Preserve the query params from the current panel
      `/tags/${name}?fullscreen=true`,
      `${name}`,
      `width=${newWindowWidth}, height=${newWindowHeight}, top=${
        window.screen.height / 2 - newWindowHeight / 2
      }, left=${window.screen.width / 2 - newWindowWidth / 2}`,
    )
  }, [])

  return (
    <Panel
      id={id}
      title={name}
      icon={<TagIcon24 />}
      actions={
        <>
          <DropdownMenu.Item icon={<ExternalLinkIcon16 />} onSelect={() => openTagWindow(name)}>
            Open in new window
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item icon={<EditIcon16 />} disabled={isRenaming} onSelect={openRenameForm}>
            Rename tag
          </DropdownMenu.Item>
          {/* TODO: Implement delete tag */}
          <DropdownMenu.Item icon={<TrashIcon16 />} disabled={true}>
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
              <h3 id="rename-tag-heading" className="mb-4 text-lg font-semibold !leading-none">
                Rename tag
              </h3>
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
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button onClick={closeRenameForm}>Cancel</Button>
                  <Button type="submit" variant="primary">
                    Rename
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
