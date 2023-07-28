import { EditorSelection } from "@codemirror/state"
import { EditorView, ViewUpdate } from "@codemirror/view"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { Params } from "react-router-dom"
import { useEvent } from "react-use"
import { z } from "zod"
import { Button } from "../components/button"
import { Card } from "../components/card"
import { DropdownMenu } from "../components/dropdown-menu"
import { FileInputButton } from "../components/file-input-button"
import { FullscreenContainer } from "../components/fullscreen-container"
import { IconButton } from "../components/icon-button"
import {
  CopyIcon16,
  EditIcon16,
  ExternalLinkIcon16,
  NoteIcon16,
  PaperclipIcon16,
} from "../components/icons"
import { Markdown } from "../components/markdown"
import { NoteEditor } from "../components/note-editor"
import { githubRepoAtom, notesAtom } from "../global-atoms"
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

  const [isDraggingOver, setIsDraggingOver] = React.useState(false)
  const editorRef = React.useRef<EditorView>()
  // TODO: Save draft in local storage
  const [draftValue, setDraftValue] = React.useState<string | undefined>()

  const handleEditorStateChange = React.useCallback((event: ViewUpdate) => {
    if (event.docChanged) {
      setDraftValue(event.state.doc.toString())
    }
  }, [])

  const parseIsEditing = React.useCallback((value: unknown) => {
    return typeof value === "string" ? value === "true" : false
  }, [])

  const [isEditing, setIsEditing] = useSearchParam("edit", {
    defaultValue: false,
    schema: z.boolean(),
    replace: true,
    parse: parseIsEditing,
  })

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
    }, 1)
  }, [setIsEditing])

  const switchToViewing = React.useCallback(() => {
    setIsEditing(false)
  }, [setIsEditing])

  const handleSave = React.useCallback(() => {
    if (draftValue) {
      upsertNote({
        id,
        rawBody: draftValue,
      })
    }

    switchToViewing()
  }, [id, draftValue, upsertNote, switchToViewing])

  const handleCancel = React.useCallback(() => {
    // Revert changes
    setDraftValue(undefined)
    switchToViewing()
  }, [switchToViewing])

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

    // Save with `command + enter` or `command + s`
    if (
      ((event.metaKey && event.key === "Enter") || (event.metaKey && event.key === "s")) &&
      isEditing
    ) {
      handleSave()
      event.preventDefault()
    }

    // Switch to editing with `e`
    if (event.key === "e" && !isEditing) {
      switchToEditing()
      event.preventDefault()
    }

    // Cancel editing with `escape`
    if (event.key === "Escape" && isEditing) {
      handleCancel()
      event.preventDefault()
    }
  })

  if (!note) {
    return (
      <FullscreenContainer title="Note" icon={<NoteIcon16 />} elevation={0}>
        <div className="grid w-full flex-grow place-items-center">Not found</div>
      </FullscreenContainer>
    )
  }

  return (
    <FullscreenContainer
      title="Note"
      icon={<NoteIcon16 />}
      elevation={1}
      actions={
        <>
          <DropdownMenu.Item
            key="edit"
            icon={<EditIcon16 />}
            shortcut={["E"]}
            disabled={isEditing}
            onSelect={switchToEditing}
          >
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            key="copy-markdown"
            icon={<CopyIcon16 />}
            shortcut={["⌘", "C"]}
            onSelect={() => copy(note.rawBody)}
          >
            Copy markdown
          </DropdownMenu.Item>
          <DropdownMenu.Item
            key="copy-id"
            icon={<CopyIcon16 />}
            shortcut={["⌘", "⇧", "C"]}
            onSelect={() => copy(id)}
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
        </>
      }
    >
      {!isEditing ? (
        <div className="w-full flex-grow p-4">
          <Markdown onChange={(markdown) => upsertNote({ id, rawBody: markdown })}>
            {draftValue ?? note.rawBody}
          </Markdown>
        </div>
      ) : (
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
            <NoteEditor
              className="flex h-full"
              editorRef={editorRef}
              defaultValue={draftValue ?? note.rawBody}
              onStateChange={handleEditorStateChange}
            />
          </div>
          <div className="sticky bottom-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <Card
              elevation={1}
              className="flex flex-shrink-0 justify-between gap-2 overflow-auto rounded-lg bg-bg-overlay-backdrop p-2 backdrop-blur-md"
            >
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

              <div className="flex gap-2">
                <Button shortcut={["esc"]} onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="primary" shortcut={["⌘", "⏎"]} onClick={handleSave}>
                  Save
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </FullscreenContainer>
  )
}
