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
- [ ] [[2025-01-02]] Parent review [[2024-12-31]] #parent
  - [ ] Child follow up [[2023-04-04]] with [[note-b]] before due [[2023-05-05]] #child
`,
  ).tasks

  expect(tasks).toEqual([
    {
      completed: false,
      text: "[ ] [[2025-01-02]] Parent review [[2024-12-31]] #parent",
      displayText: "Parent review [[2024-12-31]] #parent",
      links: ["2025-01-02", "2024-12-31"],
      date: "2025-01-02",
      tags: ["parent"],
    },
    {
      completed: false,
      text: "Child follow up [[2023-04-04]] with [[note-b]] before due [[2023-05-05]] #child",
      displayText: "Child follow up [[2023-04-04]] with [[note-b]] before due #child",
      links: ["2023-04-04", "note-b", "2023-05-05"],
      date: "2023-05-05",
      tags: ["child"],
    },
  ])
})

test("retains formatting while removing the chosen date from text", () => {
  const tasks = parseNote(
    "1234",
    `
- [x] Publish **release notes** [[2024-11-11]] for [[project-beta]]
- [ ] Draft outline [[project-gamma]] then wrap [[2024-12-12]] up
`,
  ).tasks

  expect(tasks).toEqual([
    {
      completed: true,
      text: "Publish **release notes** [[2024-11-11]] for [[project-beta]]",
      displayText: "Publish **release notes** for [[project-beta]]",
      links: ["2024-11-11", "project-beta"],
      date: "2024-11-11",
      tags: [],
    },
    {
      completed: false,
      text: "Draft outline [[project-gamma]] then wrap [[2024-12-12]] up",
      displayText: "Draft outline [[project-gamma]] then wrap up",
      links: ["project-gamma", "2024-12-12"],
      date: "2024-12-12",
      tags: [],
    },
  ])
})
