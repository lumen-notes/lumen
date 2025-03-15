import { useRegisterSW } from "virtual:pwa-register/react"
import { Button } from "./button"

export function UpdateToast() {
  // Reference: https://vite-pwa-org.netlify.app/frameworks/react.html#prompt-for-update
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log("SW registered: " + registration)

      if (registration) {
        // Check for updates every hour
        setInterval(
          () => {
            registration.update()
          },
          60 * 60 * 1000,
        )
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error)
    },
  })

  if (!needRefresh) {
    return null
  }

  return <_UpdateToast onUpdate={() => updateServiceWorker(true)} />
}

// UI-only component for rendering in Storybook
export function _UpdateToast({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="card-3 absolute bottom-[calc(var(--height-nav-bar)+12px)] left-3 right-3 z-20 flex items-center justify-between gap-4 !rounded-xl p-2 pl-4 sm:bottom-3 sm:left-[unset]">
      <div className="flex items-center gap-3">
        {/* Dot to draw attention */}
        <div aria-hidden className="h-2 w-2 rounded-full bg-border-focus" />
        New version available
      </div>
      <Button onClick={onUpdate}>Update</Button>
    </div>
  )
}
