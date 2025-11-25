import { expect, test } from "vitest"
import { parseNote } from "./parse-note"

test("stores task markdown, links, and tags", () => {
  const tasks = parseNote("1234", "- [ ] Review [[project-alpha]] plan #ops").tasks

  expect(tasks).toEqual([
    {
      completed: false,
      text: "Review [[project-alpha]] plan #ops",
      displayText: "Review [[project-alpha]] plan #ops",
      links: ["project-alpha"],
      date: null,
      tags: ["ops"],
    },
  ])
})

test("emits nested subtasks and assigns dates based on position", () => {
  const tasks = parseNote(
    "1234",
    `
- [ ] [[2025-01-02]] Parent review #parent [[2024-12-31]]
  - [ ] Child follow up [[2023-04-04]] with [[note-b]] before due #child [[2023-05-05]]
`,
  ).tasks

  expect(tasks).toEqual([
    {
      completed: false,
      text: "[[2025-01-02]] Parent review #parent [[2024-12-31]]",
      displayText: "Parent review #parent [[2024-12-31]]",
      links: ["2025-01-02", "2024-12-31"],
      date: "2025-01-02",
      tags: ["parent"],
    },
    {
      completed: false,
      text: "Child follow up [[2023-04-04]] with [[note-b]] before due #child [[2023-05-05]]",
      displayText: "Child follow up [[2023-04-04]] with [[note-b]] before due #child",
      links: ["2023-04-04", "note-b", "2023-05-05"],
      date: "2023-05-05",
      tags: ["child"],
    },
  ])
})
