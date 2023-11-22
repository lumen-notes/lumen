import React from "react"

export const useAutoTheme = () => {
  const updateTheme = React.useCallback((event?: MediaQueryListEvent) => {
    if (event?.matches || window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  React.useEffect(() => {
    // Set initial theme
    updateTheme()

    // Update theme on change
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")
    prefersDark.addEventListener("change", updateTheme)

    return () => {
      prefersDark.removeEventListener("change", updateTheme)
    }
  }, [updateTheme])
}
