import * as Dialog from "@radix-ui/react-dialog"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { flushSync } from "react-dom"
import { useHotkeys } from "react-hotkeys-hook"
import { Params } from "react-router-dom"
import { z } from "zod"
import { globalStateMachineAtom } from "../global-state"
import { useNoteById } from "../utils/use-note-by-id"
import { useSaveNote } from "../utils/use-save-note"
import { useSearchParam } from "../utils/use-search-param"
import { Button } from "./button"
import { Card } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { EditIcon16, ErrorIcon16, LoadingIcon16, MinimizeIcon16, MoreIcon16 } from "./icons"
import { Markdown } from "./markdown"
import { NoteEditor } from "./note-editor"

const FullscreenContext = React.createContext<{
  openFullscreen: (path: string) => void
  closeFullscreen: () => void
}>({
  openFullscreen: () => {},
  closeFullscreen: () => {},
})

export function useFullscreen() {
  return React.useContext(FullscreenContext)
}

export function FullscreenProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useSearchParam("fullscreen", {
    validate: z.string().nullable().catch(null).parse,
  })

  const prevActiveElement = React.useRef<HTMLElement>()

  const openFullscreen = React.useCallback(
    (path: string) => {
      prevActiveElement.current = document.activeElement as HTMLElement
      setPath(path)
    },
    [setPath],
  )

  const closeFullscreen = React.useCallback(() => {
    flushSync(() => {
      setPath(null)
    })

    // Focus the previously active element
    prevActiveElement.current?.focus()
  }, [setPath])

  const contextValue = React.useMemo(
    () => ({ openFullscreen, closeFullscreen }),
    [openFullscreen, closeFullscreen],
  )

  return (
    <FullscreenContext.Provider value={contextValue}>
      {children}
      {path ? <FullscreenDialog path={path} /> : null}
    </FullscreenContext.Provider>
  )
}

function FullscreenDialog({ path }: { path: string }) {
  // useThemeColor("--color-bg")
  const { closeFullscreen } = useFullscreen()

  // TODO: Add routing

  // Remove leading slash
  const noteId = path.replace(/^\//, "")

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-bg-inset" />
        <Dialog.Content asChild onPointerDownOutside={(event) => event.preventDefault()}>
          <Card className="fixed inset-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.5rem,env(safe-area-inset-left))] right-[max(0.5rem,env(safe-area-inset-right))] top-[max(0.5rem,env(safe-area-inset-top))] z-10 overflow-auto focus:outline-none">
            <FullscreenNote params={{ "*": noteId }} onClose={closeFullscreen} />
          </Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const isResolvingRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.resolvingRepo"),
)

function FullscreenNote({ params, onClose }: { params: Params<string>; onClose?: () => void }) {
  const { "*": noteId = "" } = params
  const note = useNoteById(noteId)
  const saveNote = useSaveNote()
  const isResolvingRepo = useAtomValue(isResolvingRepoAtom)
  const editorRef = React.useRef<ReactCodeMirrorRef>(null)
  const [isEditing, setIsEditing] = React.useState(false)

  const handleSubmit = React.useCallback(() => {
    const value = editorRef.current?.view?.state.doc.toString() ?? ""

    // Don't create empty notes
    if (!value) return

    const note = { id: noteId, content: value }

    saveNote(note)
  }, [editorRef, noteId, saveNote])

  useHotkeys(
    "e",
    () => {
      setIsEditing(true)
    },
    { enabled: !isEditing },
  )

  useHotkeys(
    "esc",
    () => {
      onClose?.()
    },
    { enabled: !isEditing },
  )

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-bg p-2">
        <div className="flex w-full items-center gap-4">
          <IconButton
            aria-label="Exit fullscreen"
            disableTooltip
            shortcut={["esc"]}
            onClick={onClose}
          >
            <MinimizeIcon16 />
          </IconButton>
          <span className="w-0 flex-grow truncate font-mono tracking-wide text-text-secondary">
            {noteId}.md
          </span>
        </div>

        <div className="">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleSubmit()
                  setIsEditing(false)
                }}
              >
                Save
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton aria-label="Note actions" disableTooltip>
                  <MoreIcon16 />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item
                  icon={<EditIcon16 />}
                  onSelect={() => {
                    setIsEditing(true)
                  }}
                  shortcut={["E"]}
                >
                  Edit
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          )}
        </div>
      </header>
      <div className="flex-grow p-4 md:p-10 lg:p-12">
        <div className="mx-auto h-full max-w-3xl">
          {isResolvingRepo ? (
            <span className="flex items-center gap-2 text-text-secondary">
              <LoadingIcon16 />
              Loading…
            </span>
          ) : isEditing ? (
            <NoteEditor
              ref={editorRef}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              defaultValue={note?.content ?? ""}
              className="h-full [&_.cm-editor]:h-full"
            />
          ) : note ? (
            <Markdown>{note!.content}</Markdown>
          ) : (
            <span className="flex items-center gap-2 text-text-danger">
              <ErrorIcon16 />
              File not found
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
