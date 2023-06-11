import React from "react"

/** Dyanmically change the theme color to match the background color */
export function ThemeColor() {
  React.useEffect(() => {
    // Set initial theme color
    setThemeColor()

    // Update theme color when the user changes their theme preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")
    prefersDark.addEventListener("change", setThemeColor)

    return () => {
      prefersDark.removeEventListener("change", setThemeColor)
    }
  }, [])

  return null
}

function setThemeColor() {
  if (typeof window === "undefined") {
    return
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]')

  const backgroundColor = window
    .getComputedStyle(document.body)
    .getPropertyValue("background-color")

  themeColorMeta?.setAttribute("content", backgroundColor)
}
