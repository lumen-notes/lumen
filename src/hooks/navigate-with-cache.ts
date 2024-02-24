import React from "react"
import { useNavigate, useLocation, resolvePath } from "react-router-dom"
import { getPrevPathParams } from "../utils/prev-path-params"

export function useNavigateWithCache() {
  const navigate = useNavigate()
  const location = useLocation()

  return React.useCallback(
    (to: string) => {
      const { pathname } = resolvePath(to)

      const prevPathParams = getPrevPathParams(pathname)

      // Navigating to the current page resets the params for that pages
      if (location.pathname === pathname) {
        navigate(to)
        return
      }

      if (prevPathParams) {
        // Navigate to the new path with the previous params for that path
        navigate({ pathname, search: prevPathParams })
      } else {
        navigate(to)
      }
    },
    [navigate, location],
  )
}
