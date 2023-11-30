import qs from "qs"
import { z } from "zod"

const STORAGE_KEY = "prev_path_params"
const ALLOWED_PARAMS = ["w", "p", "q", "v"]

const prevPathParamsSchema = z.record(z.string()).catch({})

export function savePathParams(pathname: string, search: string) {
  const prevPathParams = prevPathParamsSchema.parse(
    JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"),
  )

  const searchParams = qs.parse(search, { ignoreQueryPrefix: true })

  const filteredSearchParams = Object.fromEntries(
    Object.entries(searchParams).filter(([key]) => ALLOWED_PARAMS.includes(key)),
  )

  console.log(qs.stringify(filteredSearchParams, { addQueryPrefix: true }))

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...prevPathParams,
      [pathname]: qs.stringify(filteredSearchParams),
    }),
  )
}

export function getPrevPathParams(pathname: string) {
  const prevPathParams = prevPathParamsSchema.parse(
    JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"),
  )

  return prevPathParams[pathname]
}
