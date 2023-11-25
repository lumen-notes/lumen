import { z } from "zod"
import { useSearchParam } from "../utils/use-search-param"
import React from "react"

const FullscreenContext = React.createContext<{ openFullscreen: (path: string) => void }>({
  openFullscreen: () => {},
})

export function useFullscreen() {
  return React.useContext(FullscreenContext)
}

export function FullscreenProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useSearchParam("fullscreen", {
    defaultValue: "",
    schema: z.string(),
  })

  const openFullscreen = React.useCallback(
    (path: string) => {
      setPath(path)
    },
    [setPath],
  )

  const contextValue = React.useMemo(() => ({ openFullscreen }), [openFullscreen])

  return (
    <FullscreenContext.Provider value={contextValue}>
      {path}
      {children}
    </FullscreenContext.Provider>
  )
}
