import * as Dialog from "@radix-ui/react-dialog"
import React from "react"
import { flushSync } from "react-dom"
import { z } from "zod"
import { useNoteById } from "../utils/use-note-by-id"
import { useSearchParam } from "../utils/use-search-param"
import { IconButton } from "./icon-button"
import { MinimizeIcon16 } from "./icons"
import { Markdown } from "./markdown"

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
    defaultValue: null,
    schema: z.string().nullable(),
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
  const { closeFullscreen } = useFullscreen()

  // Remove leading slash
  const noteId = path.replace(/^\//, "")
  const note = useNoteById(noteId)

  if (!note) {
    return null
  }

  return (
    <Dialog.Root open onOpenChange={closeFullscreen}>
      <Dialog.Portal>
        <Dialog.Content className="fixed inset-0 overflow-auto bg-bg outline-none">
          <header className="sticky top-0 z-10 grid grid-cols-3 items-center bg-bg p-2">
            <div className="justify-self-start">
              <Dialog.Close asChild>
                <IconButton aria-label="Exit fullscreen" disableTooltip shortcut={["esc"]}>
                  <MinimizeIcon16 />
                </IconButton>
              </Dialog.Close>
            </div>
            <Dialog.Title className="justify-self-center text-text-secondary">
              {noteId}.md
            </Dialog.Title>
            {/* <div className="justify-self-end">
              <IconButton aria-label="Note actions">
                <MoreIcon16 />
              </IconButton>
            </div> */}
          </header>
          <div className="p-4 md:p-10 lg:p-12">
            <div className="mx-auto max-w-3xl">
              <Markdown>{note.content}</Markdown>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
