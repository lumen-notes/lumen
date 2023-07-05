import { EditorView, ViewUpdate } from "@codemirror/view"
import * as RovingFocusGroup from "@radix-ui/react-roving-focus"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { useParams } from "react-router-dom"
import { useEvent } from "react-use"
import { z } from "zod"
import { Button, ButtonProps } from "../components/button"
import { Card } from "../components/card"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import { CopyIcon16, ExternalLinkIcon16, MoreIcon16, PaperclipIcon16 } from "../components/icons"
import { Markdown } from "../components/markdown"
import { NoteEditor } from "../components/note-editor"
import { ThemeColor } from "../components/theme-color"
import { githubRepoAtom, notesAtom } from "../global-atoms"
import { cx } from "../utils/cx"
import { useUpsertNote } from "../utils/github-sync"
import { useSearchParam } from "../utils/use-search-param"

export function NotePage() {
  const { id = "" } = useParams()
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes[id]), [id])
  const note = useAtomValue(noteAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const upsertNote = useUpsertNote()
  const [isEditing, setIsEditing] = useSearchParam("edit", {
    defaultValue: false,
    schema: z.boolean(),
  })
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const editorRef = React.useRef<EditorView>()
  const [newValue, setNewValue] = React.useState<string | undefined>()

  const handleEditorStateChange = React.useCallback((event: ViewUpdate) => {
    if (event.docChanged) {
      setNewValue(event.state.doc.toString())
    }
  }, [])

  const handleSave = React.useCallback(() => {
    if (newValue) {
      upsertNote({
        id,
        rawBody: newValue,
      })
    }
  }, [id, newValue, upsertNote])

  const handleRevert = React.useCallback(() => {
    editorRef.current?.dispatch({
      changes: {
        from: 0,
        to: editorRef.current.state.doc.length,
        insert: note.rawBody,
      },
    })
  }, [note?.rawBody])

  const switchToEditing = React.useCallback(() => {
    setIsEditing(true)
  }, [setIsEditing])

  const switchToViewing = React.useCallback(() => {
    setIsEditing(false)
  }, [setIsEditing])

  useEvent("keydown", (event) => {
    // Copy markdown with `command + c` if no text is selected
    if (event.metaKey && event.key == "c" && !window.getSelection()?.toString()) {
      copy(note.rawBody)
      event.preventDefault()
    }

    // Copy id with `command + shift + c`
    if (event.metaKey && event.shiftKey && event.key == "c") {
      copy(id)
      event.preventDefault()
    }

    // Open dropdown with `command + .`
    if (event.key === "." && event.metaKey) {
      setIsDropdownOpen(true)
      event.preventDefault()
    }

    // Save with `command + enter`
    if (event.key === "Enter" && event.metaKey) {
      handleSave()
      event.preventDefault()
    }

    // TODO: Add shortcut for reverting

    // Toggle edit mode with `command + e`
    if (event.key === "e" && event.metaKey) {
      if (isEditing) {
        switchToViewing()
      } else {
        switchToEditing()
      }
      event.preventDefault()
    }
  })

  if (!note) {
    return <div>Not found</div>
  }
  return (
    <div className="flex h-screen flex-col overflow-auto bg-bg [@supports(height:100svh)]:h-[100svh]">
      {/* Make browser toolbar color match the note's background color */}
      <ThemeColor propertyName="--color-bg" />

      <div className="w-full flex-grow p-4">
        {!isEditing ? (
          <Markdown>{newValue ?? note.rawBody}</Markdown>
        ) : (
          <NoteEditor
            className="flex h-full"
            editorRef={editorRef}
            defaultValue={newValue ?? note.rawBody}
            onStateChange={handleEditorStateChange}
          />
        )}
      </div>

      <Card
        elevation={1}
        className="sticky bottom-2 m-2 flex flex-shrink-0 justify-between gap-2 overflow-auto rounded-md bg-bg-overlay-backdrop p-2 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          {/* TODO: Use tabs component */}
          <SegmentedControl>
            <SegmentedControl.Button selected={!isEditing} onClick={switchToViewing}>
              View
            </SegmentedControl.Button>
            <SegmentedControl.Button selected={isEditing} onClick={switchToEditing}>
              Edit
            </SegmentedControl.Button>
          </SegmentedControl>
          {isEditing ? (
            <>
              <div className="h-[50%] w-px bg-border-secondary" />
              <IconButton aria-label="Attach file">
                <PaperclipIcon16 />
              </IconButton>
            </>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button disabled={!newValue || newValue === note.rawBody} onClick={handleRevert}>
            Revert
          </Button>
          <Button
            disabled={!newValue || newValue === note.rawBody}
            variant="primary"
            shortcut={["⌘", "⏎"]}
            onClick={handleSave}
          >
            Save
          </Button>

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
            <DropdownMenu.Trigger asChild>
              <IconButton aria-label="Note actions" shortcut={["⌘", "."]} tooltipSide="top">
                <MoreIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item
                icon={<CopyIcon16 />}
                onSelect={() => copy(note.rawBody)}
                shortcut={["⌘", "C"]}
              >
                Copy markdown
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<CopyIcon16 />}
                onSelect={() => copy(id)}
                shortcut={["⌘", "⇧", "C"]}
              >
                Copy ID
              </DropdownMenu.Item>
              {githubRepo ? (
                <>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    icon={<ExternalLinkIcon16 />}
                    href={`https://github.com/${githubRepo.owner}/${githubRepo.name}/blob/main/${id}.md`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in GitHub
                  </DropdownMenu.Item>
                </>
              ) : null}
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </Card>
    </div>
  )
}

function SegmentedControl({ children }: { children: React.ReactNode }) {
  return (
    <RovingFocusGroup.Root orientation="horizontal">
      <ul className="flex gap-2 rounded-sm">{children}</ul>
    </RovingFocusGroup.Root>
  )
}

SegmentedControl.Button = ({
  selected = false,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & {
  selected?: boolean
  shortcut?: ButtonProps["shortcut"]
}) => {
  return (
    <li>
      <RovingFocusGroup.Item asChild active={selected}>
        <Button
          aria-current={selected}
          className={cx("ring-0", selected && "bg-bg-secondary", className)}
          {...props}
        />
      </RovingFocusGroup.Item>
    </li>
  )
}
