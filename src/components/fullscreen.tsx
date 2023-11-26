import { z } from "zod"
import { useSearchParam } from "../utils/use-search-param"
import React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { IconButton } from "./icon-button"
import { MinimizeIcon16 } from "./icons"

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
    defaultValue: "",
    schema: z.string(),
  })

  const openFullscreen = React.useCallback((path: string) => setPath(path), [setPath])
  const closeFullscreen = React.useCallback(() => setPath(""), [setPath])

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
  return (
    <Dialog.Root open onOpenChange={closeFullscreen}>
      <Dialog.Portal>
        <Dialog.Content className="fixed inset-0 bg-bg outline-none">
          <header className="p-2">
            <Dialog.Close asChild>
              <IconButton aria-label="Exit fullscreen" shortcut={["esc"]}>
                <MinimizeIcon16 />
              </IconButton>
            </Dialog.Close>
            {/* {path} */}
          </header>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
