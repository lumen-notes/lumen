// import qs from "qs"
import React from "react"
// import { useLocation, useNavigate } from "react-router-dom"
import { Schema } from "zod"
// import { PanelContext, PanelActionsContext } from "../components/panels"

type SearchParamOptions<T = string> = {
  defaultValue: T
  schema: Schema<T>
  parse?: (value: unknown) => T
  replace?: boolean
}

function defaultParse<T>(value: unknown): T {
  return value as T
}

// Reference: https://www.inkoop.io/blog/syncing-query-parameters-with-react-state/
export function useSearchParam<T = string>(
  key: string,
  { defaultValue, schema, parse = defaultParse, replace = false }: SearchParamOptions<T>,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // const location = useLocation()
  // const navigate = useNavigate()
  // const { updatePanel } = React.useContext(PanelsContext)
  // const panel = React.useContext(PanelContext)
  // const searchParams = qs.parse(panel ? panel.search : location.search, { ignoreQueryPrefix: true })

  // const [value, setValue] = React.useState(() => {
  //   try {
  //     return schema.parse(parse(searchParams[key]))
  //   } catch (error) {
  //     console.error(error)
  //     return defaultValue
  //   }
  // })

  // const valueRef = React.useRef(value)

  // const setValueAndParam = React.useCallback(
  //   (value: T) => {
  //     setValue(value)
  //     valueRef.current = value

  //     React.startTransition(() => {
  //       const searchString = qs.stringify({ ...searchParams, [key]: value }, { skipNulls: true })

  //       if (panel) {
  //         updatePanel?.(panel.index, { search: searchString })
  //       } else {
  //         navigate(`${location.pathname}?${searchString}`, { replace })
  //       }
  //     })
  //   },
  //   [searchParams, key, navigate, location.pathname, replace, panel, updatePanel],
  // )

  // // If location changes, update the value
  // React.useEffect(() => {
  //   const searchParams = qs.parse(panel ? panel.search : location.search, {
  //     ignoreQueryPrefix: true,
  //   })

  //   // If the value is already up to date, don't update it
  //   if (valueRef.current !== parse(searchParams[key])) {
  //     const newValue = parse(searchParams[key])
  //     setValue(newValue)
  //     valueRef.current = newValue
  //   }
  // }, [location, panel, valueRef, parse, key])

  // return [value, setValueAndParam]
  const [value, setValue] = React.useState(defaultValue)
  return [value, setValue]
}
