import { useAtomValue } from "jotai"
import React from "react"
import { isRepoClonedAtom } from "../global-state"
import { fs } from "../utils/fs"
import { REPO_DIR } from "../utils/git"

export function useLoadTheme() {
  const isRepoCloned = useAtomValue(isRepoClonedAtom)

  React.useEffect(() => {
    if (!isRepoCloned) return

    async function loadTheme() {
      try {
        // Try to read theme.css from the repo
        const content = await fs.promises.readFile(`${REPO_DIR}/theme.css`, "utf8")

        // Create a style element
        const style = document.createElement("style")
        style.setAttribute("id", "custom-theme")
        style.textContent = content.toString()

        // Remove any existing custom theme
        document.getElementById("custom-theme")?.remove()

        // Add the new style element
        document.head.appendChild(style)
      } catch (error) {
        // If theme.css doesn't exist, that's fine - we'll use default theme
        console.debug("No custom theme found:", error)
      }
    }

    loadTheme()
  }, [isRepoCloned])
}
