import type { ListItem, Node } from "mdast-util-from-markdown/lib"
import { toString } from "mdast-util-to-string"
import { visit } from "unist-util-visit"
import { isValidDateString } from "./date"
import type { NoteId, Task } from "../schema"

export function getTaskContent(node: ListItem, value: string) {
  const firstContentChild = node.children?.find((child) => child.type !== "list") ?? node
  const start = firstContentChild.position?.start?.offset
  const end = firstContentChild.position?.end?.offset

  const text =
    typeof start === "number" && typeof end === "number" && start < end
      ? value.slice(start, end)
      : toString(firstContentChild)

  // Remove leading '[ ]' or '[x]' if present
  const trimmedText = text.replace(/^\s*\[( |x|X)\]\s*/, "").trim()

  return {
    text: trimmedText,
    node: firstContentChild,
  }
}

export function getTaskLinks(node: Node): NoteId[] {
  const noteIds = new Set<NoteId>()

  visit(node, (child) => {
    if (
      (child.type === "wikilink" || child.type === "embed") &&
      child.data &&
      typeof child.data.id === "string"
    ) {
      noteIds.add(child.data.id)
    }
  })

  return Array.from(noteIds)
}

export function getTaskTags(node: Node): string[] {
  const tags = new Set<string>()

  visit(node, (child) => {
    if (child.type === "tag" && child.data && typeof child.data.name === "string") {
      tags.add(child.data.name)
    }
  })

  return Array.from(tags)
}

export function getTaskDate(links: NoteId[]): string | null {
  const dateLinks = links.filter((link) => isValidDateString(link))
  if (dateLinks.length === 0) {
    return null
  }

  return dateLinks[dateLinks.length - 1]
}

export function getTaskDisplayText(text: string): string {
  // Regex to match [[YYYY-MM-DD]] at start or end, with optional surrounding whitespace
  return text
    .replace(/^\s*\[\[\d{4}-\d{2}-\d{2}\]\]\s*/u, "")
    .replace(/\s*\[\[\d{4}-\d{2}-\d{2}\]\]\s*$/u, "")
    .trim()
}

export function updateTask({
  content,
  task,
  completed,
}: {
  content: string
  task: Task
  completed: boolean
}): string {
  // Abort early if the task is already in the desired state
  if (task.completed === completed) {
    return content
  }

  // Escape special regex characters in the task text
  // Note: task.text may contain wikilinks like [[...]], so brackets need to be escaped
  const escapedText = task.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  // Match: "-" followed by exactly 1 space, then "[ ]" or "[x]" or "[X]",
  // followed by 1+ spaces, then the task text
  const pattern = new RegExp(`(- \\[[ xX]\\])\\s+(${escapedText})`, "u")

  const match = content.match(pattern)
  if (!match) {
    // If we can't find the task, return the original content
    return content
  }

  // Replace [ ] with [x] or [x]/[X] with [ ] based on completed state
  const newCheckbox = completed ? "[x]" : "[ ]"
  // Preserve the original spacing and task text from the match
  const replacement = `- ${newCheckbox} ${match[2]}`

  return content.replace(pattern, replacement)
}
