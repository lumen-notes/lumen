import { useSearchParams } from "react-router-dom"

/** Returns true if the URL contains `fullscreen` query param */
export function useIsFullscreen() {
  const [searchParams] = useSearchParams()
  return searchParams.get("fullscreen") !== null && searchParams.get("fullscreen") !== "false"
}
