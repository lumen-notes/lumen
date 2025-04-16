import { useAtomValue, useSetAtom } from "jotai"
import React from "react"
import { globalStateMachineAtom, isRepoClonedAtom } from "../global-state"
import { fs } from "../utils/fs"
import { REPO_DIR } from "../utils/git"
import path from "path"

const THEME_COLORS = {
  sand: "#dad9d6",
  cyan: "#9ddde7",
  yellow: "#f3d768",
  amber: "#f3d673",
  green: "#adddc0",
  red: "#fdbdbe",
  purple: "#e0c4f4",
  orange: "#ffc182",
} as const

export type ThemeColor = keyof typeof THEME_COLORS
export const THEME_COLORS_MAP = THEME_COLORS

export function getCurrentTheme(): ThemeColor {
  // Try to load saved theme from CSS variables
  const style = getComputedStyle(document.documentElement)
  const neutral6 = style.getPropertyValue("--neutral-6").trim()

  // Find which theme matches the current neutral-6 value
  const savedTheme = Object.entries(THEME_COLORS).find(([_, value]) => {
    return neutral6 === value || neutral6 === `var(--${value}-6)`
  })?.[0] as ThemeColor

  return savedTheme || "sand"
}

export function applyTheme(color: ThemeColor) {
  const cssVars = {} as Record<string, string>

  // Update neutral scale variables
  for (let i = 1; i <= 12; i++) {
    const neutralVar = `--neutral-${i}`
    const newColorVar = `--${color}-${i}`
    cssVars[neutralVar] = `var(${newColorVar})`
  }

  // Update alpha variables
  for (let i = 1; i <= 12; i++) {
    const neutralVar = `--neutral-a${i}`
    const newColorVar = `--${color}-a${i}`
    cssVars[neutralVar] = `var(${newColorVar})`
  }

  // Apply colors immediately
  Object.entries(cssVars).forEach(([variable, value]) => {
    document.documentElement.style.setProperty(variable, value)
  })

  return cssVars
}

export function generateThemeCSS(cssVars: Record<string, string>) {
  return `:root {
${Object.entries(cssVars)
  .map(([variable, value]) => `  ${variable}: ${value};`)
  .join("\n")}
}
`
}

export function useLoadTheme() {
  const isRepoCloned = useAtomValue(isRepoClonedAtom)

  React.useEffect(() => {
    if (!isRepoCloned) return

    async function loadTheme() {
      try {
        // Try to read theme.css from the .lumen directory
        const content = await fs.promises.readFile(`${REPO_DIR}/.lumen/theme.css`, "utf8")

        // Create a style element
        const style = document.createElement("style")
        style.setAttribute("id", "custom-theme")
        style.textContent = content.toString()

        // Remove any existing custom theme
        document.getElementById("custom-theme")?.remove()

        // Add the new style element
        document.head.appendChild(style)
      } catch (error) {
        // If theme.css doesn't exist, apply the default theme
        console.debug("No custom theme found:", error)
        applyTheme("sand")
      }
    }

    loadTheme()
  }, [isRepoCloned])
}

export function useSaveTheme() {
  const send = useSetAtom(globalStateMachineAtom)

  return React.useCallback(
    async (color: ThemeColor) => {
      const cssVars = applyTheme(color)
      const cssContent = generateThemeCSS(cssVars)

      // First ensure the .lumen directory exists
      try {
        const lumenDir = path.join(REPO_DIR, ".lumen")
        try {
          await fs.promises.stat(lumenDir)
        } catch {
          await fs.promises.mkdir(lumenDir)
        }
      } catch (error) {
        console.debug("Error creating .lumen directory:", error)
      }

      // Save theme.css to the .lumen directory using the global state machine
      send({
        type: "WRITE_FILES",
        markdownFiles: { ".lumen/theme.css": cssContent },
        commitMessage: `Update theme colors to ${color}`,
      })

      // Also update the style element
      const style = document.getElementById("custom-theme") || document.createElement("style")
      style.setAttribute("id", "custom-theme")
      style.textContent = cssContent

      if (!style.parentElement) {
        document.head.appendChild(style)
      }
    },
    [send],
  )
}
