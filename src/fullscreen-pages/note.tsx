import { EditorSelection } from "@codemirror/state"
import { EditorView, ViewUpdate } from "@codemirror/view"
import * as RovingFocusGroup from "@radix-ui/react-roving-focus"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Params } from "react-router-dom"
import { useEvent } from "react-use"
import { z } from "zod"
import { Button, ButtonProps } from "../components/button"
import { Card } from "../components/card"
import { DropdownMenu } from "../components/dropdown-menu"
import { FileInputButton } from "../components/file-input-button"
import { FullscreenContainer } from "../components/fullscreen-container"
import { IconButton } from "../components/icon-button"
import {
  CopyIcon16,
  ExternalLinkIcon16,
  MoreIcon16,
  NoteIcon16,
  PaperclipIcon16,
} from "../components/icons"
import { Markdown } from "../components/markdown"
import { NoteEditor } from "../components/note-editor"
import { githubRepoAtom, notesAtom } from "../global-atoms"
import { cx } from "../utils/cx"
import { useUpsertNote } from "../utils/github-sync"
import { useAttachFile } from "../utils/use-attach-file"
import { useSearchParam } from "../utils/use-search-param"

type FullscreenNotePageProps = {
  params: Params<string>
}

export function FullscreenNotePage({ params }: FullscreenNotePageProps) {
  const { id = "" } = params
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes[id]), [id])
  const note = useAtomValue(noteAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const upsertNote = useUpsertNote()
  const attachFile = useAttachFile()
  const [isEditing, setIsEditing] = useSearchParam("edit", {
    defaultValue: false,
    schema: z.boolean(),
    replace: true,
  })
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)
  const editorRef = React.useRef<EditorView>()
  // TODO: Save draft in local storage
  const [draftValue, setDraftValue] = React.useState<string | undefined>()

  const handleEditorStateChange = React.useCallback((event: ViewUpdate) => {
    if (event.docChanged) {
      setDraftValue(event.state.doc.toString())
    }
  }, [])

  const handleSave = React.useCallback(() => {
    if (draftValue) {
      upsertNote({
        id,
        rawBody: draftValue,
      })
    }
  }, [id, draftValue, upsertNote])

  const switchToEditing = React.useCallback(() => {
    setIsEditing(true)
    // Wait for the editor to mount
    setTimeout(() => {
      const view = editorRef.current
      if (view) {
        // Focus the editor
        view.focus()
        // Move cursor to end of document
        view.dispatch({
          selection: EditorSelection.cursor(view.state.doc.sliceString(0).length),
        })
      }
    })
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

    // Save with `command + enter` or `command + s`
    if ((event.key === "Enter" && event.metaKey) || (event.key === "s" && event.metaKey)) {
      handleSave()
      event.preventDefault()
    }

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
    return (
      <div className="grid h-screen w-full place-items-center [@supports(height:100svh)]:h-[100svh]">
        Not found
      </div>
    )
  }

  return (
    <FullscreenContainer title="Note" icon={<NoteIcon16 />} className="bg-bg">
      <div
        className="relative flex flex-grow flex-col bg-bg"
        // Reference: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
        onDrop={(event) => {
          // Only allow drop event if editing
          if (!isEditing) return

          const [item] = Array.from(event.dataTransfer.items)
          const file = item.getAsFile()

          if (file) {
            attachFile(file, editorRef.current)
            event.preventDefault()
          }

          setIsDraggingOver(false)
        }}
        onDragOver={(event) => {
          // Allow drop event
          event.preventDefault()
        }}
        onDragEnter={(event) => {
          setIsDraggingOver(true)
          event.preventDefault()
        }}
      >
        {/* Dropzone overlay */}
        {isEditing && isDraggingOver ? (
          <div
            className="absolute inset-0 z-10 bg-bg-secondary"
            onDragLeave={(event) => {
              setIsDraggingOver(false)
              event.preventDefault()
            }}
          />
        ) : null}

        <div className="grid w-full flex-grow p-4">
          {!isEditing ? (
            <Markdown>{draftValue ?? note.rawBody}</Markdown>
          ) : (
            <NoteEditor
              className="flex h-full"
              editorRef={editorRef}
              defaultValue={draftValue ?? note.rawBody}
              onStateChange={handleEditorStateChange}
            />
          )}
        </div>

        <div className="sticky bottom-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Card
            elevation={1}
            className="flex flex-shrink-0 justify-between gap-2 overflow-auto rounded-lg bg-bg-overlay-backdrop p-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              {/* TODO: Use tabs component: https://www.radix-ui.com/docs/primitives/components/tabs */}
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
                  <FileInputButton
                    asChild
                    onChange={(files) => {
                      if (!files) return

                      const [file] = Array.from(files)

                      if (file) {
                        attachFile(file, editorRef.current)
                      }
                    }}
                  >
                    <IconButton aria-label="Attach file" disabled={!githubRepo}>
                      <PaperclipIcon16 />
                    </IconButton>
                  </FileInputButton>
                </>
              ) : null}
            </div>

            <div className="flex gap-2">
              {/* Only show save button when there are changes */}
              {draftValue && draftValue !== note.rawBody ? (
                <Button
                  variant={draftValue && draftValue !== note.rawBody ? "primary" : "secondary"}
                  shortcut={["⌘", "⏎"]}
                  onClick={handleSave}
                >
                  Save
                </Button>
              ) : null}

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
      </div>
    </FullscreenContainer>
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
