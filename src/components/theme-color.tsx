import React from "react"
import { useEvent, useMount } from "react-use"

/** Dyanmically change the theme color to match the background color */
export function ThemeColor() {
  useMount(setThemeColor)
  useEvent("visibilitychange", setThemeColor)

  React.useEffect(() => {
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
