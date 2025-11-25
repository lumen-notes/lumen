import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmTaskListItemFromMarkdown } from "mdast-util-gfm-task-list-item"
import { visit } from "unist-util-visit"
import { describe, expect, test } from "vitest"
import { embedFromMarkdown } from "../remark-plugins/embed"
import { tagFromMarkdown } from "../remark-plugins/tag"
import { wikilinkFromMarkdown } from "../remark-plugins/wikilink"
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item"
import { embed } from "../remark-plugins/embed"
import { tag } from "../remark-plugins/tag"
import { wikilink } from "../remark-plugins/wikilink"
import {
  getTaskContent,
  getTaskDate,
  getTaskDisplayText,
  getTaskLinks,
  getTaskTags,
  updateTask,
} from "./task"

function parseMarkdown(content: string) {
  const extensions = [gfmTaskListItem(), wikilink(), embed(), tag()]
  const mdastExtensions = [
    gfmTaskListItemFromMarkdown(),
    wikilinkFromMarkdown(),
    embedFromMarkdown(),
    tagFromMarkdown(),
  ]

  return fromMarkdown(
    content,
    // @ts-ignore TODO: Fix types
    { extensions, mdastExtensions },
  )
}

function findFirstListItem(root: ReturnType<typeof parseMarkdown>) {
  let listItem = null
  visit(root, (node) => {
    if (node.type === "listItem" && !listItem) {
      listItem = node
    }
  })
  return listItem
}

describe("getTaskContent", () => {
  test("extracts task text from a simple task", () => {
    const root = parseMarkdown("- [ ] Do laundry")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskContent(listItem, "- [ ] Do laundry")
      expect(result.text).toBe("Do laundry")
    }
  })

  test("extracts task text from a completed task", () => {
    const root = parseMarkdown("- [x] Complete project")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskContent(listItem, "- [x] Complete project")
      expect(result.text).toBe("Complete project")
    }
  })

  test("extracts task text with wikilinks", () => {
    const root = parseMarkdown("- [ ] Review [[project-alpha]] plan")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskContent(listItem, "- [ ] Review [[project-alpha]] plan")
      expect(result.text).toBe("Review [[project-alpha]] plan")
    }
  })

  test("extracts task text with tags", () => {
    const root = parseMarkdown("- [ ] Task with #tag")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskContent(listItem, "- [ ] Task with #tag")
      expect(result.text).toBe("Task with #tag")
    }
  })

  test("handles tasks with extra whitespace", () => {
    const root = parseMarkdown("- [ ]   Task with spaces")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskContent(listItem, "- [ ]   Task with spaces")
      expect(result.text).toBe("Task with spaces")
    }
  })
})

describe("getTaskLinks", () => {
  test("extracts wikilinks from task content", () => {
    const root = parseMarkdown("- [ ] Review [[project-alpha]] and [[project-beta]]")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskLinks(listItem)
      expect(result).toEqual(["project-alpha", "project-beta"])
    }
  })

  test("extracts date links", () => {
    const root = parseMarkdown("- [ ] Task due [[2024-12-31]]")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskLinks(listItem)
      expect(result).toEqual(["2024-12-31"])
    }
  })

  test("extracts embeds", () => {
    const root = parseMarkdown("- [ ] Review ![[note-embed]]")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskLinks(listItem)
      expect(result).toEqual(["note-embed"])
    }
  })

  test("returns empty array when no links", () => {
    const root = parseMarkdown("- [ ] Simple task")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskLinks(listItem)
      expect(result).toEqual([])
    }
  })

  test("deduplicates links", () => {
    const root = parseMarkdown("- [ ] Review [[project-alpha]] and [[project-alpha]] again")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskLinks(listItem)
      expect(result).toEqual(["project-alpha"])
    }
  })
})

describe("getTaskTags", () => {
  test("extracts tags from task content", () => {
    const root = parseMarkdown("- [ ] Task with #tag")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskTags(listItem)
      expect(result).toEqual(["tag"])
    }
  })

  test("extracts multiple tags", () => {
    const root = parseMarkdown("- [ ] Task with #tag1 and #tag2")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskTags(listItem)
      expect(result.sort()).toEqual(["tag1", "tag2"])
    }
  })

  test("extracts nested tags", () => {
    const root = parseMarkdown("- [ ] Task with #parent/child")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskTags(listItem)
      expect(result).toEqual(["parent/child"])
    }
  })

  test("returns empty array when no tags", () => {
    const root = parseMarkdown("- [ ] Simple task")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskTags(listItem)
      expect(result).toEqual([])
    }
  })

  test("deduplicates tags", () => {
    const root = parseMarkdown("- [ ] Task with #tag and #tag")
    const listItem = findFirstListItem(root)
    expect(listItem).not.toBeNull()

    if (listItem) {
      const result = getTaskTags(listItem)
      expect(result).toEqual(["tag"])
    }
  })
})

describe("getTaskDate", () => {
  test("returns the last date link when multiple dates present", () => {
    const links = ["2024-01-01", "2024-12-31", "note-id"]
    expect(getTaskDate(links)).toBe("2024-12-31")
  })

  test("returns the date when single date present", () => {
    const links = ["2024-12-31"]
    expect(getTaskDate(links)).toBe("2024-12-31")
  })

  test("returns null when no date links", () => {
    const links = ["note-id", "another-note"]
    expect(getTaskDate(links)).toBe(null)
  })

  test("returns null when links array is empty", () => {
    expect(getTaskDate([])).toBe(null)
  })

  test("filters out non-date links", () => {
    const links = ["note-id", "2024-12-31", "another-note"]
    expect(getTaskDate(links)).toBe("2024-12-31")
  })
})

describe("getTaskDisplayText", () => {
  test("removes date link from start of text", () => {
    expect(getTaskDisplayText("[[2024-12-31]] Task text")).toBe("Task text")
  })

  test("removes date link from end of text", () => {
    expect(getTaskDisplayText("Task text [[2024-12-31]]")).toBe("Task text")
  })

  test("removes date link from start with whitespace", () => {
    expect(getTaskDisplayText("  [[2024-12-31]]  Task text")).toBe("Task text")
  })

  test("removes date link from end with whitespace", () => {
    expect(getTaskDisplayText("Task text  [[2024-12-31]]  ")).toBe("Task text")
  })

  test("removes date links from both start and end", () => {
    expect(getTaskDisplayText("[[2024-01-01]] Task text [[2024-12-31]]")).toBe("Task text")
  })

  test("does not remove non-date wikilinks", () => {
    expect(getTaskDisplayText("Review [[project-alpha]] plan")).toBe(
      "Review [[project-alpha]] plan",
    )
  })

  test("returns text unchanged when no date links", () => {
    expect(getTaskDisplayText("Simple task text")).toBe("Simple task text")
  })

  test("trims whitespace after removing date links", () => {
    expect(getTaskDisplayText("  [[2024-12-31]]  ")).toBe("")
  })
})

describe("updateTask", () => {
  test("marks incomplete task as completed", () => {
    const content = "- [ ] Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      displayText: "Do laundry",
      links: [],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [x] Do laundry")
  })

  test("marks completed task as incomplete", () => {
    const content = "- [x] Do laundry"
    const task = {
      completed: true,
      text: "Do laundry",
      displayText: "Do laundry",
      links: [],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: false })
    expect(result).toBe("- [ ] Do laundry")
  })

  test("handles uppercase X in checkbox", () => {
    const content = "- [X] Do laundry"
    const task = {
      completed: true,
      text: "Do laundry",
      displayText: "Do laundry",
      links: [],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: false })
    expect(result).toBe("- [ ] Do laundry")
  })

  test("preserves extra spaces between checkbox and text", () => {
    const content = "- [ ]   Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      displayText: "Do laundry",
      links: [],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [x] Do laundry")
  })

  test("handles tasks with wikilinks", () => {
    const content = "- [ ] Review [[project-alpha]] plan"
    const task = {
      completed: false,
      text: "Review [[project-alpha]] plan",
      displayText: "Review [[project-alpha]] plan",
      links: ["project-alpha"],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [x] Review [[project-alpha]] plan")
  })

  test("handles tasks with tags", () => {
    const content = "- [ ] Task with #tag"
    const task = {
      completed: false,
      text: "Task with #tag",
      displayText: "Task with #tag",
      links: [],
      tags: ["tag"],
      date: null,
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [x] Task with #tag")
  })

  test("handles tasks with date links", () => {
    const content = "- [ ] Task due [[2024-12-31]]"
    const task = {
      completed: false,
      text: "Task due [[2024-12-31]]",
      displayText: "Task due",
      links: ["2024-12-31"],
      tags: [],
      date: "2024-12-31",
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [x] Task due [[2024-12-31]]")
  })

  test("handles tasks with special regex characters", () => {
    const content = "- [ ] Task with (parentheses) and [brackets]"
    const task = {
      completed: false,
      text: "Task with (parentheses) and [brackets]",
      displayText: "Task with (parentheses) and [brackets]",
      links: [],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [x] Task with (parentheses) and [brackets]")
  })

  test("returns original content if task not found", () => {
    const content = "- [ ] Different task"
    const task = {
      completed: false,
      text: "This task doesn't exist",
      displayText: "This task doesn't exist",
      links: [],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [ ] Different task")
  })

  test("returns original content if task already in desired state", () => {
    const content = "- [ ] Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      displayText: "Do laundry",
      links: [],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: false })
    expect(result).toBe("- [ ] Do laundry")
  })

  test("only updates first matching task when multiple exist", () => {
    const content = "- [ ] First task\n- [ ] Second task"
    const task = {
      completed: false,
      text: "First task",
      displayText: "First task",
      links: [],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [x] First task\n- [ ] Second task")
  })

  test("updates task in the middle of multiline content", () => {
    const content = "- [ ] First task\n- [ ] Middle task\n- [ ] Last task"
    const task = {
      completed: false,
      text: "Middle task",
      displayText: "Middle task",
      links: [],
      tags: [],
      date: null,
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [ ] First task\n- [x] Middle task\n- [ ] Last task")
  })

  test("handles tasks with markdown formatting", () => {
    const content = "- [ ] Publish **release notes** [[2024-11-11]]"
    const task = {
      completed: false,
      text: "Publish **release notes** [[2024-11-11]]",
      displayText: "Publish **release notes**",
      links: ["2024-11-11"],
      tags: [],
      date: "2024-11-11",
    }

    const result = updateTask({ content, task, completed: true })
    expect(result).toBe("- [x] Publish **release notes** [[2024-11-11]]")
  })
})
