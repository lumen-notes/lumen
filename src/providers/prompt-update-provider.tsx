import { createContext, useMemo } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"

type PromptProviderState = {
  needRefresh: boolean
  updateServiceWorker: (force: boolean) => void
}

const initialState: PromptProviderState = {
  needRefresh: false,
  updateServiceWorker: () => {},
}

export const PromptUpdateContext = createContext<PromptProviderState>(initialState)

interface PromptProviderProps {
  children: React.ReactNode
}
const intervalMS = 60 * 60 * 1000

export const PromptUpdateProvider: React.FC<PromptProviderProps> = ({ children }) => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => {
          r.update()
        }, intervalMS)
      }
      console.log("SW Registered: " + r)
    },
    onRegisterError(error) {
      console.error("SW registration error", error)
    },
  })

  const value = useMemo(() => {
    return {
      needRefresh,
      updateServiceWorker,
    }
  }, [needRefresh, updateServiceWorker])

  return <PromptUpdateContext.Provider value={value}>{children}</PromptUpdateContext.Provider>
}
