import { useAtomValue } from "jotai"
import React from "react"
import { themeAtom } from "../global-state"

export const THEME_COLOR_VAR = "--color-bg"

/** Dyanmically change the theme color */
export function useThemeColor() {
  const theme = useAtomValue(themeAtom)

  const setThemeColor = React.useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    const themeColorMetaTag = document.querySelector('meta[name="theme-color"]')

    const themeColor = window.getComputedStyle(document.body).getPropertyValue(THEME_COLOR_VAR)

    themeColorMetaTag?.setAttribute("content", themeColor)
  }, [])

  React.useEffect(() => {
    // Set initial theme color
    setTimeout(setThemeColor)

    // Update theme color when the user changes their theme preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")
    prefersDark.addEventListener("change", setThemeColor)

    return () => {
      prefersDark.removeEventListener("change", setThemeColor)
    }
  }, [setThemeColor, theme])
}
