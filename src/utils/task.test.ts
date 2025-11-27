import { fromMarkdown } from "mdast-util-from-markdown"
import type { ListItem } from "mdast-util-from-markdown/lib"
import { gfmTaskListItemFromMarkdown } from "mdast-util-gfm-task-list-item"
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item"
import { visit } from "unist-util-visit"
import { describe, expect, test } from "vitest"
import { embed, embedFromMarkdown } from "../remark-plugins/embed"
import { tag, tagFromMarkdown } from "../remark-plugins/tag"
import { wikilink, wikilinkFromMarkdown } from "../remark-plugins/wikilink"
import {
  getTaskContent,
  getTaskDate,
  removeDateFromTaskText,
  getTaskLinks,
  getTaskTags,
  updateTaskCompletion,
  updateTaskText,
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

function findFirstListItem(root: ReturnType<typeof parseMarkdown>): ListItem | null {
  let listItem: ListItem | null = null
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
  test("returns the first date link when task starts with a date", () => {
    const links = ["2024-01-01", "2024-12-31", "note-id"]
    const text = "[[2024-01-01]] Task with multiple dates [[2024-12-31]]"
    expect(getTaskDate(links, text)).toBe("2024-01-01")
  })

  test("returns the last date link when task does not start with a date", () => {
    const links = ["2024-01-01", "2024-12-31", "note-id"]
    const text = "Task with multiple dates [[2024-01-01]] [[2024-12-31]]"
    expect(getTaskDate(links, text)).toBe("2024-12-31")
  })

  test("returns the date when single date present", () => {
    const links = ["2024-12-31"]
    const text = "Task with date [[2024-12-31]]"
    expect(getTaskDate(links, text)).toBe("2024-12-31")
  })

  test("returns null when no date links", () => {
    const links = ["note-id", "another-note"]
    const text = "Task with no dates"
    expect(getTaskDate(links, text)).toBe(null)
  })

  test("returns null when links array is empty", () => {
    expect(getTaskDate([], "Task with no links")).toBe(null)
  })

  test("filters out non-date links", () => {
    const links = ["note-id", "2024-12-31", "another-note"]
    const text = "Task with date [[2024-12-31]]"
    expect(getTaskDate(links, text)).toBe("2024-12-31")
  })
})

describe("removeDateFromTaskText", () => {
  test("removes date link from start of text", () => {
    expect(removeDateFromTaskText("[[2024-12-31]] Task text")).toBe("Task text")
  })

  test("removes date link from end of text", () => {
    expect(removeDateFromTaskText("Task text [[2024-12-31]]")).toBe("Task text")
  })

  test("removes date link from start with whitespace", () => {
    expect(removeDateFromTaskText("  [[2024-12-31]]  Task text")).toBe("Task text")
  })

  test("removes date link from end with whitespace", () => {
    expect(removeDateFromTaskText("Task text  [[2024-12-31]]  ")).toBe("Task text")
  })

  test("removes only start date when task starts with a date", () => {
    expect(removeDateFromTaskText("[[2024-01-01]] Task text [[2024-12-31]]")).toBe(
      "Task text [[2024-12-31]]",
    )
  })

  test("does not remove non-date wikilinks", () => {
    expect(removeDateFromTaskText("Review [[project-alpha]] plan")).toBe(
      "Review [[project-alpha]] plan",
    )
  })

  test("returns text unchanged when no date links", () => {
    expect(removeDateFromTaskText("Simple task text")).toBe("Simple task text")
  })

  test("trims whitespace after removing date links", () => {
    expect(removeDateFromTaskText("  [[2024-12-31]]  ")).toBe("")
  })
})

describe("updateTaskCompletion", () => {
  test("marks incomplete task as completed", () => {
    const content = "- [ ] Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe("- [x] Do laundry")
  })

  test("marks completed task as incomplete", () => {
    const content = "- [x] Do laundry"
    const task = {
      completed: true,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: false })
    expect(result).toBe("- [ ] Do laundry")
  })

  test("handles uppercase X in checkbox", () => {
    const content = "- [X] Do laundry"
    const task = {
      completed: true,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: false })
    expect(result).toBe("- [ ] Do laundry")
  })

  test("preserves extra spaces between checkbox and text", () => {
    const content = "- [ ]   Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe("- [x]   Do laundry")
  })

  test("handles tasks with wikilinks", () => {
    const content = "- [ ] Review [[project-alpha]] plan"
    const task = {
      completed: false,
      text: "Review [[project-alpha]] plan",
      links: ["project-alpha"],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe("- [x] Review [[project-alpha]] plan")
  })

  test("handles tasks with tags", () => {
    const content = "- [ ] Task with #tag"
    const task = {
      completed: false,
      text: "Task with #tag",
      links: [],
      tags: ["tag"],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe("- [x] Task with #tag")
  })

  test("handles tasks with date links", () => {
    const content = "- [ ] Task due [[2024-12-31]]"
    const task = {
      completed: false,
      text: "Task due [[2024-12-31]]",
      links: ["2024-12-31"],
      tags: [],
      date: "2024-12-31",
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe("- [x] Task due [[2024-12-31]]")
  })

  test("handles tasks with special regex characters", () => {
    const content = "- [ ] Task with (parentheses) and [brackets]"
    const task = {
      completed: false,
      text: "Task with (parentheses) and [brackets]",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe("- [x] Task with (parentheses) and [brackets]")
  })

  test("returns original content if task already in desired state", () => {
    const content = "- [ ] Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: false })
    expect(result).toBe("- [ ] Do laundry")
  })

  test("updates first task when multiple exist", () => {
    const content = "- [ ] First task\n- [ ] Second task"
    const task = {
      completed: false,
      text: "First task",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe("- [x] First task\n- [ ] Second task")
  })

  test("updates task in the middle of multiline content", () => {
    const content = "- [ ] First task\n- [ ] Middle task\n- [ ] Last task"
    const task = {
      completed: false,
      text: "Middle task",
      links: [],
      tags: [],
      date: null,
      startOffset: 17, // Position of "- [ ] Middle task"
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe("- [ ] First task\n- [x] Middle task\n- [ ] Last task")
  })

  test("handles tasks with markdown formatting", () => {
    const content = "- [ ] Publish **release notes** [[2024-11-11]]"
    const task = {
      completed: false,
      text: "Publish **release notes** [[2024-11-11]]",
      links: ["2024-11-11"],
      tags: [],
      date: "2024-11-11",
      startOffset: 0,
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe("- [x] Publish **release notes** [[2024-11-11]]")
  })

  test("updates correct duplicate task using position", () => {
    const content = "- [ ] Buy milk\n- [ ] Buy milk"
    const secondTask = {
      completed: false,
      text: "Buy milk",
      links: [],
      tags: [],
      date: null,
      startOffset: 15, // Position of second "- [ ] Buy milk"
    }

    const result = updateTaskCompletion({ content, task: secondTask, completed: true })
    expect(result).toBe("- [ ] Buy milk\n- [x] Buy milk")
  })

  test("updates first of duplicate tasks correctly", () => {
    const content = "- [ ] Buy milk\n- [ ] Buy milk"
    const firstTask = {
      completed: false,
      text: "Buy milk",
      links: [],
      tags: [],
      date: null,
      startOffset: 0, // Position of first "- [ ] Buy milk"
    }

    const result = updateTaskCompletion({ content, task: firstTask, completed: true })
    expect(result).toBe("- [x] Buy milk\n- [ ] Buy milk")
  })

  test("updates task with frontmatter offset correctly", () => {
    const content = `---
title: My Note
---

- [ ] Task after frontmatter`
    const task = {
      completed: false,
      text: "Task after frontmatter",
      links: [],
      tags: [],
      date: null,
      startOffset: 24, // "---\ntitle: My Note\n---\n\n" = 24 chars
    }

    const result = updateTaskCompletion({ content, task, completed: true })
    expect(result).toBe(`---
title: My Note
---

- [x] Task after frontmatter`)
  })
})

describe("updateTaskText", () => {
  test("updates task text", () => {
    const content = "- [ ] Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskText({ content, task, text: "Do dishes" })
    expect(result).toBe("- [ ] Do dishes")
  })

  test("preserves checkbox state when updating text", () => {
    const content = "- [x] Do laundry"
    const task = {
      completed: true,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskText({ content, task, text: "Do dishes" })
    expect(result).toBe("- [x] Do dishes")
  })

  test("handles empty text", () => {
    const content = "- [ ] Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskText({ content, task, text: "" })
    expect(result).toBe("- [ ]")
  })

  test("handles whitespace-only text", () => {
    const content = "- [ ] Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskText({ content, task, text: "   " })
    expect(result).toBe("- [ ]")
  })

  test("trims whitespace from new text", () => {
    const content = "- [ ] Do laundry"
    const task = {
      completed: false,
      text: "Do laundry",
      links: [],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskText({ content, task, text: "  Do dishes  " })
    expect(result).toBe("- [ ] Do dishes")
  })

  test("updates task in multiline content", () => {
    const content = "- [ ] First task\n- [ ] Second task\n- [ ] Third task"
    const task = {
      completed: false,
      text: "Second task",
      links: [],
      tags: [],
      date: null,
      startOffset: 17,
    }

    const result = updateTaskText({ content, task, text: "Updated task" })
    expect(result).toBe("- [ ] First task\n- [ ] Updated task\n- [ ] Third task")
  })

  test("updates last task in content", () => {
    const content = "- [ ] First task\n- [ ] Last task"
    const task = {
      completed: false,
      text: "Last task",
      links: [],
      tags: [],
      date: null,
      startOffset: 17,
    }

    const result = updateTaskText({ content, task, text: "Updated last" })
    expect(result).toBe("- [ ] First task\n- [ ] Updated last")
  })

  test("handles task with wikilinks", () => {
    const content = "- [ ] Review [[project-alpha]]"
    const task = {
      completed: false,
      text: "Review [[project-alpha]]",
      links: ["project-alpha"],
      tags: [],
      date: null,
      startOffset: 0,
    }

    const result = updateTaskText({ content, task, text: "Review [[project-beta]]" })
    expect(result).toBe("- [ ] Review [[project-beta]]")
  })

  test("handles task with date links", () => {
    const content = "- [ ] Task due [[2024-12-31]]"
    const task = {
      completed: false,
      text: "Task due [[2024-12-31]]",
      links: ["2024-12-31"],
      tags: [],
      date: "2024-12-31",
      startOffset: 0,
    }

    const result = updateTaskText({ content, task, text: "Task due [[2025-01-01]]" })
    expect(result).toBe("- [ ] Task due [[2025-01-01]]")
  })

  test("updates correct duplicate task using position", () => {
    const content = "- [ ] Buy milk\n- [ ] Buy milk"
    const secondTask = {
      completed: false,
      text: "Buy milk",
      links: [],
      tags: [],
      date: null,
      startOffset: 15,
    }

    const result = updateTaskText({ content, task: secondTask, text: "Buy eggs" })
    expect(result).toBe("- [ ] Buy milk\n- [ ] Buy eggs")
  })

  test("updates task with frontmatter offset correctly", () => {
    const content = `---
title: My Note
---

- [ ] Task after frontmatter`
    const task = {
      completed: false,
      text: "Task after frontmatter",
      links: [],
      tags: [],
      date: null,
      startOffset: 24,
    }

    const result = updateTaskText({ content, task, text: "Updated task" })
    expect(result).toBe(`---
title: My Note
---

- [ ] Updated task`)
  })
})
