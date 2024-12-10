import React from "react"

const themeColorVar = "--color-bg"

/** Dyanmically change the theme color */
export function useThemeColor() {
  const setThemeColor = React.useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]')

    const themeColor = window.getComputedStyle(document.body).getPropertyValue(themeColorVar)

    themeColorMeta?.setAttribute("content", themeColor)
  }, [])

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
