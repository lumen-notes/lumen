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

export function getTaskDate(links: NoteId[], text: string): string | null {
  const dateLinks = links.filter((link) => isValidDateString(link))
  if (dateLinks.length === 0) {
    return null
  }

  // Check if task starts with a date
  const startsWithDate = /^\s*\[\[\d{4}-\d{2}-\d{2}\]\]/.test(text)

  if (startsWithDate) {
    // Use the first date link
    return dateLinks[0]
  }

  // Otherwise, use the last date link
  return dateLinks[dateLinks.length - 1]
}

export function getTaskDisplayText(text: string, taskDate: string | null = null): string {
  // Check if task starts with a date
  const startsWithDate = /^\s*\[\[\d{4}-\d{2}-\d{2}\]\]/.test(text)

  if (startsWithDate) {
    // Remove date from start
    return text.replace(/^\s*\[\[\d{4}-\d{2}-\d{2}\]\]\s*/u, "").trim()
  }

  // Otherwise, remove date from end (if present)
  return text.replace(/\s*\[\[\d{4}-\d{2}-\d{2}\]\]\s*$/u, "").trim()
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

  // Use position-based update to handle duplicate tasks correctly
  const newCheckbox = completed ? "- [x]" : "- [ ]"
  return content.slice(0, task.startOffset) + newCheckbox + content.slice(task.startOffset + 5)
}
