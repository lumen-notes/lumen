import React from "react"
import { useSearchParams } from "react-router-dom"
import { FullscreenContainerContext } from "../components/fullscreen-container"

/** Returns true if the URL contains `fullscreen` query param */
export function useIsFullscreen() {
  const inFullscreenContainer = React.useContext(FullscreenContainerContext)
  const [searchParams] = useSearchParams()
  return (
    inFullscreenContainer ||
    (searchParams.get("fullscreen") !== null && searchParams.get("fullscreen") !== "false")
  )
}
