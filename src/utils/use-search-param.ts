import debounce from "lodash.debounce"
import qs from "qs"
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { usePanel, usePanelActions } from "../components/panels"
import { savePathParams } from "./prev-path-params"

type SearchParamOptions<T = string> = {
  validate?: (value: unknown) => T
  replace?: boolean
}

function defaultValidate<T>(value: unknown): T {
  return value as T
}

// Reference: https://www.inkoop.io/blog/syncing-query-parameters-with-react-state/
export function useSearchParam<T = string>(
  key: string,
  { validate = defaultValidate, replace = false }: SearchParamOptions<T>,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const location = useLocation()
  const navigate = useNavigate()
  const { updatePanel } = usePanelActions()
  const panel = usePanel()
  const searchParams = qs.parse(panel ? panel.search : location.search, { ignoreQueryPrefix: true })
  const [value, setValue] = React.useState(() => validate(searchParams[key]))

  // Create stable references to the latest values
  const valueRef = React.useRef(value)
  const panelRef = React.useRef(panel)
  const locationRef = React.useRef(location)
  const searchParamsRef = React.useRef(searchParams)

  React.useEffect(() => {
    valueRef.current = value
  }, [value])

  React.useEffect(() => {
    panelRef.current = panel
  }, [panel])

  React.useEffect(() => {
    locationRef.current = location
  }, [location])

  React.useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  const setParam = React.useCallback(
    debounce((value: T) => {
      const searchString = qs.stringify(
        { ...searchParamsRef.current, [key]: value },
        { skipNulls: true },
      )

      if (panelRef.current) {
        updatePanel?.(panelRef.current.index, { search: searchString })
      } else {
        navigate(`${locationRef.current.pathname}?${searchString}`, { replace })
        savePathParams(locationRef.current.pathname, searchString)
      }
    }, 250),
    [key, updatePanel, navigate, replace],
  )

  const setValueAndParam: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (valueOrUpdater) => {
      const value =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as (prevValue: T) => T)(valueRef.current)
          : valueOrUpdater
      setValue(value)
      setParam(value)
    },
    [setParam],
  )

  return [value, setValueAndParam]
}
