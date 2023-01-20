import { useEvent, useMount } from "react-use"

function setThemeColor() {
  if (typeof window === "undefined") {
    return
  }

  const themeColorMeta = document.querySelector('meta[name="theme-color"]')

  const themeColor = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--color-bg-inset")

  themeColorMeta?.setAttribute("content", themeColor)
}

/** Dyanmically change the theme color to match the preferred color scheme */
export function ThemeColor() {
  useMount(setThemeColor)
  useEvent("colorschemechange", setThemeColor)
  return null
}
