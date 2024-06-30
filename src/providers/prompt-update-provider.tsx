import { createContext, useMemo } from "react"
import { toast } from "sonner"
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
    offlineReady: [offlineReady, setOfflineReady],
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

  const onOfflineClose = () => setOfflineReady(false)

  if (offlineReady) {
    toast("App ready to work offline", {
      id: "ready_to_work_offline",
      onDismiss: onOfflineClose,
      onAutoClose: onOfflineClose,
    })
  }

  if (needRefresh) {
    toast("New content available", {
      id: "new_content_available",
      description: "click on reload button to update",
      action: {
        label: "Reload",
        onClick: () => updateServiceWorker(true),
      },
    })
  }

  const value = useMemo(() => {
    return {
      needRefresh,
      updateServiceWorker,
    }
  }, [needRefresh, updateServiceWorker])

  return <PromptUpdateContext.Provider value={value}>{children}</PromptUpdateContext.Provider>
}
