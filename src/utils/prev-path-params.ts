import { Location } from "react-router-dom"
import { z } from "zod"

const STORAGE_KEY = "prev_path_params"

const prevPathParamsSchema = z.record(z.string())

export function savePathParams(location: Location) {
  const prevPathParams = prevPathParamsSchema.parse(
    JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"),
  )

  // Don't cache fullscreen pages
  const fullscreen = new URLSearchParams(location.search).get("fullscreen")
  if (fullscreen && fullscreen !== "false") {
    return
  }

  // TODO: Don't cache `token` and `username` params
  // TODO: Create allowlist of params to cache
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...prevPathParams, [location.pathname]: location.search }),
  )
}

export function getPrevPathParams(pathname: string) {
  const prevPathParams = prevPathParamsSchema.parse(
    JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"),
  )

  return prevPathParams[pathname]
}
