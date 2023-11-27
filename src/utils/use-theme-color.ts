import { atom, useAtomValue } from "jotai"
import React from "react"

// The name of the CSS variable that will be used to set the theme color
export const themeColorAtom = atom<string>("--color-bg-inset")

/** Dyanmically change the theme color */
export function useThemeColor() {
  const variableName = useAtomValue(themeColorAtom)

  const setThemeColor = React.useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]')

    const themeColor = window.getComputedStyle(document.body).getPropertyValue(variableName)

    themeColorMeta?.setAttribute("content", themeColor)
  }, [variableName])

  React.useEffect(() => {
    // Set initial theme color
    setThemeColor()

    // Update theme color when the user changes their theme preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")
    prefersDark.addEventListener("change", setThemeColor)

    return () => {
      prefersDark.removeEventListener("change", setThemeColor)
    }
  }, [setThemeColor])
}
