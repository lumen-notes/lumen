import qs from "qs"
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Schema } from "zod"

type UseSearchParamOptions<T = string> = {
  defaultValue: T
  schema: Schema<T>
}

// Reference: https://www.inkoop.io/blog/syncing-query-parameters-with-react-state/
export function useSearchParam<T = string>(
  key: string,
  { defaultValue, schema }: UseSearchParamOptions<T>,
): [T, (value: T) => void] {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = qs.parse(location.search, { ignoreQueryPrefix: true })
  const value = schema.parse(searchParams[key] ?? defaultValue)

  const setValue = React.useCallback(
    (value: T) => {
      const searchString = qs.stringify({ ...searchParams, [key]: value }, { skipNulls: true })
      navigate(`${location.pathname}?${searchString}`, { replace: true })
    },
    [searchParams, key, navigate],
  )

  return [value, setValue]
}
