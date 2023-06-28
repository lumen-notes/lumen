import React from "react"

/** Dyanmically change the theme color to match the background color */
export function ThemeColor({ propertyName = "background-color" }: { propertyName?: string }) {
  const setThemeColor = React.useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]')

    const backgroundColor = window.getComputedStyle(document.body).getPropertyValue(propertyName)

    themeColorMeta?.setAttribute("content", backgroundColor)
  }, [propertyName])

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

  return null
}
