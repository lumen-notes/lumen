import { useContext } from "react"
import { PromptUpdateContext } from "../providers/prompt-update-provider"

export function usePromptUpdate() {
  const context = useContext(PromptUpdateContext)

  if (context === undefined) {
    throw new Error("usePromptUpdate must be used within a PromptUpdateProvider")
  }

  return context
}
