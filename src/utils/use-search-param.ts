import qs from "qs"
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Schema } from "zod"
import { PanelContext, PanelsContext } from "../components/panels"

type UseSearchParamOptions<T = string> = {
  defaultValue: T
  schema: Schema<T>
  replace?: boolean
}

// Reference: https://www.inkoop.io/blog/syncing-query-parameters-with-react-state/
export function useSearchParam<T = string>(
  key: string,
  { defaultValue, schema, replace = false }: UseSearchParamOptions<T>,
): [T, (value: T) => void] {
  const location = useLocation()
  const navigate = useNavigate()
  const { updatePanel } = React.useContext(PanelsContext)
  const panel = React.useContext(PanelContext)
  const searchParams = qs.parse(panel ? panel.search : location.search, { ignoreQueryPrefix: true })

  let value: T

  try {
    value = schema.parse(searchParams[key])
  } catch (error) {
    value = defaultValue
  }

  const setValue = React.useCallback(
    (value: T) => {
      const searchString = qs.stringify({ ...searchParams, [key]: value }, { skipNulls: true })
      if (panel && updatePanel) {
        updatePanel(panel.index, { search: searchString })
      } else {
        navigate(`${location.pathname}?${searchString}`, { replace })
      }
    },
    [searchParams, key, navigate],
  )

  return [value, setValue]
}
