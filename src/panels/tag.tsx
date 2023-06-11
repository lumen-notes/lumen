import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Button } from "../components/button"
import { Card } from "../components/card"
import { TagIcon24 } from "../components/icons"
import { Input } from "../components/input"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"
import { Panel } from "../components/panel"
import { PanelContext, PanelProps, PanelsContext } from "../components/panels"
import { tagsAtom } from "../global-atoms"
import { useRenameTag } from "../utils/github-sync"

export function TagPanel({ id, params = {}, onClose }: PanelProps) {
  const { "*": name = "" } = params
  const noteCountAtom = React.useMemo(
    () => selectAtom(tagsAtom, (tags) => tags[name]?.length ?? 0),
    [name],
  )
  const noteCount = useAtomValue(noteCountAtom)
  const renameTag = useRenameTag()
  const { updatePanel } = React.useContext(PanelsContext)
  const panel = React.useContext(PanelContext)
  const [isRenaming, setIsRenaming] = React.useState(false)
  const nameInputRef = React.useRef<HTMLInputElement>(null)
  const prevActiveElement = React.useRef<HTMLElement>()

  const openRenameForm = React.useCallback(() => {
    setIsRenaming(true)
    prevActiveElement.current = document.activeElement as HTMLElement
    setTimeout(() => nameInputRef.current?.focus())
  }, [])

  const closeRenameForm = React.useCallback(() => {
    setIsRenaming(false)
    setTimeout(() => prevActiveElement.current?.focus())
  }, [])

  return (
    <Panel id={id} title={name} icon={<TagIcon24 />} onClose={onClose}>
      <LinkHighlightProvider href={`/tags/${name}`}>
        <div className="p-4">
          <Button disabled={isRenaming} onClick={openRenameForm}>
            Rename tag
          </Button>
          {isRenaming ? (
            <Card className="mb-4 p-4" elevation={1}>
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
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      closeRenameForm()
                    }
                  }}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Button shortcut={["esc"]} onClick={closeRenameForm}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" shortcut={["⏎"]}>
                    Save
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}
          <NoteList key={name} baseQuery={`tag:${name}`} noteCount={noteCount} />
        </div>
      </LinkHighlightProvider>
    </Panel>
  )
}
