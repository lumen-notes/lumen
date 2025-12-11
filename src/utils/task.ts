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

export function getTaskPriority(node: Node): 1 | 2 | 3 | null {
  let priority: 1 | 2 | 3 | null = null

  visit(node, (child) => {
    if (
      child.type === "priority" &&
      child.data &&
      typeof child.data.level === "number" &&
      child.data.level >= 1 &&
      child.data.level <= 3
    ) {
      // Last priority wins
      priority = child.data.level as 1 | 2 | 3
    }
  })

  return priority
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

export function removeDateFromTaskText(text: string, taskDate: string | null = null): string {
  if (!taskDate) {
    return text
  }

  // Escape the date for use in regex (dates don't have special chars, but be safe)
  const escapedDate = taskDate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  // Remove the specific date wikilink when at word boundaries (start, end, or surrounded by whitespace)
  const pattern = new RegExp(`(^|\\s)\\[\\[${escapedDate}\\]\\](\\s|$)`, "g")

  return text.replace(pattern, " ").replace(/\s+/g, " ").trim()
}

export function updateTaskCompletion({
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

export function updateTaskText({
  content,
  task,
  text,
}: {
  content: string
  task: Task
  text: string
}): string {
  const checkboxLength = 5 // "- [ ]" or "- [x]"
  const originalTextStart = task.startOffset + checkboxLength
  // Find where the task text ends (next newline or end of content)
  const restOfContent = content.slice(originalTextStart)
  const newlineIndex = restOfContent.indexOf("\n")
  const originalTextEnd = newlineIndex === -1 ? content.length : originalTextStart + newlineIndex

  // Preserve checkbox, replace text (add space after checkbox if text is non-empty)
  const checkbox = content.slice(task.startOffset, originalTextStart)
  const textWithSpace = text.trim() ? " " + text.trim() : ""
  return (
    content.slice(0, task.startOffset) + checkbox + textWithSpace + content.slice(originalTextEnd)
  )
}

export function deleteTask({
  content,
  task,
}: {
  content: string
  task: Task
}): string {
  // Find the start of the line containing the task
  let lineStart = task.startOffset
  while (lineStart > 0 && content[lineStart - 1] !== "\n") {
    lineStart--
  }

  // Get the indentation of this task (everything before "- [")
  const taskLine = content.slice(lineStart, task.startOffset)
  const taskIndent = taskLine.length

  // Find the end of the task and any nested content
  // We need to find where this task's content ends (including nested items)
  let lineEnd = task.startOffset
  // First, find end of current line
  while (lineEnd < content.length && content[lineEnd] !== "\n") {
    lineEnd++
  }
  // Include the newline
  if (lineEnd < content.length) {
    lineEnd++
  }

  // Now scan forward for nested content (lines with greater indentation)
  while (lineEnd < content.length) {
    // Find end of next line
    let nextLineEnd = lineEnd
    while (nextLineEnd < content.length && content[nextLineEnd] !== "\n") {
      nextLineEnd++
    }

    const nextLine = content.slice(lineEnd, nextLineEnd)

    // Empty line - check if it's followed by more nested content
    if (nextLine.trim() === "") {
      // Include the empty line for now, we'll check what comes after
      lineEnd = nextLineEnd
      if (lineEnd < content.length) {
        lineEnd++ // Include newline
      }
      continue
    }

    // Check indentation of this line
    const nextLineIndent = nextLine.length - nextLine.trimStart().length

    // If indentation is greater than task, it's nested content - include it
    if (nextLineIndent > taskIndent) {
      lineEnd = nextLineEnd
      if (lineEnd < content.length) {
        lineEnd++ // Include newline
      }
    } else {
      // Not nested, stop here
      break
    }
  }

  // Remove the task and its nested content
  return content.slice(0, lineStart) + content.slice(lineEnd)
}
