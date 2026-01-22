import { useSyncExternalStore } from "react"

function subscribe(callback: () => void) {
  // Listen for changes to touch capability (though this rarely changes)
  window.addEventListener("touchstart", callback, { once: true })
  return () => {
    window.removeEventListener("touchstart", callback)
  }
}

function getSnapshot() {
  return ("ontouchstart" in window) || navigator.maxTouchPoints > 0
}

function getServerSnapshot() {
  return false
}

/**
 * Hook to detect if the device has touch capabilities.
 * Returns true for touch-capable devices (phones, tablets, touch laptops).
 */
export function useIsTouchDevice() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
