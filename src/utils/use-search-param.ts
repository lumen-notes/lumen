import qs from "qs"
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"

// Reference: https://www.inkoop.io/blog/syncing-query-parameters-with-react-state/
export function useSearchParam(
  key: string,
  defaultValue: string = "",
): [string, (value: string) => void] {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = qs.parse(location.search, { ignoreQueryPrefix: true })
  const searchParam = searchParams[key]
  const value = typeof searchParam === "string" ? searchParam : defaultValue

  const setValue = React.useCallback(
    (value: string) => {
      const searchString = qs.stringify({ ...searchParams, [key]: value }, { skipNulls: true })
      navigate(`${location.pathname}?${searchString}`, { replace: true })
    },
    [searchParams, key, navigate],
  )

  return [value, setValue]
}
