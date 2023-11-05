import { EditorSelection } from "@codemirror/state"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import React from "react"
import { Params, useParams } from "react-router-dom"
import { useEvent } from "react-use"
import { z } from "zod"
import { CommandMenu } from "../components/command-menu"
import { DropdownMenu } from "../components/dropdown-menu"
import { FullscreenContainer } from "../components/fullscreen-container"
import { FullscreenNoteForm } from "../components/fullscreen-note-form"
import { CopyIcon16, EditIcon16, ExternalLinkIcon16, NoteIcon16 } from "../components/icons"
import { Markdown } from "../components/markdown"
import { Panels } from "../components/panels"
import { githubRepoAtom } from "../global-state"
import { NotePanel } from "../panels/note"
import { useUpsertNote } from "../utils/github-sync"
import { useIsFullscreen } from "../utils/use-is-fullscreen"
import { useNoteById } from "../utils/use-note-by-id"
import { useSearchParam } from "../utils/use-search-param"

export function NotePage() {
  const isFullscreen = useIsFullscreen()
  const params = useParams()

  if (isFullscreen) {
    return (
      <>
        <CommandMenu />
        <FullscreenNotePage params={params} />
      </>
    )
  }

  return (
    <Panels>
      <CommandMenu />
      <NotePanel params={params} />
      <Panels.Outlet />
    </Panels>
  )
}

type FullscreenNotePageProps = {
  params: Params<string>
}

function FullscreenNotePage({ params }: FullscreenNotePageProps) {
  const { "*": id = "" } = params
  const note = useNoteById(id)
  const githubRepo = useAtomValue(githubRepoAtom)
  const upsertNote = useUpsertNote()
  const editorRef = React.useRef<ReactCodeMirrorRef>(null)
  // TODO: Save draft in local storage

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
      const view = editorRef.current?.view
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

  useEvent("keydown", (event) => {
    // Copy markdown with `command + c` if no text is selected
    if (event.metaKey && event.key == "c" && !window.getSelection()?.toString()) {
      copy(note?.rawBody || "")
      event.preventDefault()
    }

    // Copy id with `command + shift + c`
    if (event.metaKey && event.shiftKey && event.key == "c") {
      copy(id)
      event.preventDefault()
    }

    // Switch to editing with `e`
    if (event.key === "e" && !isEditing) {
      switchToEditing()
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
            {note.rawBody}
          </Markdown>
        </div>
      ) : (
        <FullscreenNoteForm
          id={id}
          defaultValue={note.rawBody}
          editorRef={editorRef}
          onSubmit={switchToViewing}
          onCancel={switchToViewing}
        />
      )}
    </FullscreenContainer>
  )
}
