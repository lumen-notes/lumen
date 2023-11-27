import { atom, useSetAtom, useAtomValue } from "jotai"
import React from "react"

// A stack of CSS variables to use as the theme color
const themeColorStackAtom = atom<string[]>(["--color-bg-inset"])

export function useThemeColor(variableName: string) {
  const setStack = useSetAtom(themeColorStackAtom)

  const push = React.useCallback(
    (variableName: string) => {
      setStack((stack) => [variableName, ...stack])
    },
    [setStack],
  )

  const pop = React.useCallback(() => {
    setStack((stack) => stack.slice(1))
  }, [setStack])

  React.useEffect(() => {
    push(variableName)

    return () => {
      pop()
    }
  }, [variableName, push, pop])
}

/** Dyanmically change the theme color */
export function useThemeColorProvider() {
  const stack = useAtomValue(themeColorStackAtom)

  const setThemeColor = React.useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]')

    const themeColor = window.getComputedStyle(document.body).getPropertyValue(stack[0])

    themeColorMeta?.setAttribute("content", themeColor)
  }, [stack])

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
