import { describe, test, expect } from "vitest"
import { updateFrontmatterKey, updateFrontmatterValue } from "./frontmatter"

describe("updateFrontmatterValue", () => {
  function runTests(
    tests: {
      description: string
      content: string
      properties: Record<string, string | boolean | number | Date | null>
      output: string
    }[],
  ) {
    for (const { description, content, properties, output } of tests) {
      test(description, () => {
        const result = updateFrontmatterValue({ content, properties })
        expect(result).toBe(output)
      })
    }
  }

  runTests([
    {
      description: "add new frontmatter",
      content: "Hello",
      properties: { title: "Test" },
      output: `---
title: Test
---

Hello`,
    },
    {
      description: "handle empty string values",
      content: "Hello",
      properties: { title: "" },
      output: `---
title: ""
---

Hello`,
    },
    {
      description: "update existing frontmatter",
      content: `---
title: Old
---

Hello`,
      properties: { title: "New" },
      output: `---
title: New
---

Hello`,
    },
    {
      description: "add new property to existing frontmatter",
      content: `---
title: Test
---

Hello`,
      properties: { tags: "test" },
      output: `---
title: Test
tags: test
---

Hello`,
    },
    {
      description: "remove property using null",
      content: `---
title: Test
tags: test
---

Hello`,
      properties: { tags: null },
      output: `---
title: Test
---

Hello`,
    },
    {
      description: "update multiple properties",
      content: `---
title: Test
tags: old
---

Hello`,
      properties: { title: "New", tags: "new" },
      output: `---
title: New
tags: new
---

Hello`,
    },
    {
      description: "handle boolean values",
      content: "Hello",
      properties: { draft: true },
      output: `---
draft: true
---

Hello`,
    },
    {
      description: "handle number values",
      content: "Hello",
      properties: { priority: 1 },
      output: `---
priority: 1
---

Hello`,
    },
    {
      description: "handle Date values",
      content: "Hello",
      properties: { updated_at: new Date("2024-01-15T10:30:00.000Z") },
      output: `---
updated_at: 2024-01-15T10:30:00.000Z
---

Hello`,
    },
    {
      description: "quote strings that look like dates",
      content: "Hello",
      properties: { date_string: "2024-01-15" },
      output: `---
date_string: "2024-01-15"
---

Hello`,
    },
    {
      description: "quote strings that look like booleans",
      content: "Hello",
      properties: { status: "true" },
      output: `---
status: "true"
---

Hello`,
    },
    {
      description: "quote strings with special characters",
      content: "Hello",
      properties: { note: "item: value" },
      output: `---
note: "item: value"
---

Hello`,
    },
    {
      description: "remove all properties",
      content: `---
title: Test
tags: test
---

Hello`,
      properties: { title: null, tags: null },
      output: "Hello",
    },
    {
      description: "empty content with frontmatter",
      content: "",
      properties: { title: "Test" },
      output: `---
title: Test
---

`,
    },
    {
      description: "add quoted key when key contains space",
      content: "Hello",
      properties: { "draft status": true },
      output: `---
"draft status": true
---

Hello`,
    },
    {
      description: "update existing quoted key value",
      content: `---
"draft status": false
---

Hello`,
      properties: { "draft status": true },
      output: `---
"draft status": true
---

Hello`,
    },
    {
      description: "add property when key contains colon (quoted)",
      content: "Hello",
      properties: { "title:subtitle": "Part I" },
      output: `---
"title:subtitle": Part I
---

Hello`,
    },
    {
      description: "update existing quoted colon key value",
      content: `---
"title:subtitle": "Part I"
---

Hello`,
      properties: { "title:subtitle": "Part II" },
      output: `---
"title:subtitle": Part II
---

Hello`,
    },
  ])
})

describe("updateFrontmatterKey", () => {
  function runTests(
    tests: {
      description: string
      content: string
      oldKey: string
      newKey: string
      output: string
    }[],
  ) {
    for (const { description, content, oldKey, newKey, output } of tests) {
      test(description, () => {
        const result = updateFrontmatterKey({ content, oldKey, newKey })
        expect(result).toBe(output)
      })
    }
  }

  runTests([
    {
      description: "empty new key leaves content unchanged",
      content: `---
title: "Hello"
---

Body`,
      oldKey: "title",
      newKey: "",
      output: `---
title: "Hello"
---

Body`,
    },
    {
      description: "rename key to unquoted safe name",
      content: `---
"draft status": true
---

Hello`,
      oldKey: "draft status",
      newKey: "draft-status",
      output: `---
draft-status: true
---

Hello`,
    },
    {
      description: "rename key to quoted unsafe name",
      content: `---
title: "Hello"
---

Body`,
      oldKey: "title",
      newKey: "page title",
      output: `---
"page title": "Hello"
---

Body`,
    },
    {
      description: "renaming to existing key appends numeric suffix",
      content: `---
foo: 1
bar: 2
---

Body`,
      oldKey: "foo",
      newKey: "bar",
      output: `---
bar1: 1
bar: 2
---

Body`,
    },
    {
      description: "rename colon key to safe key without quotes",
      content: `---
"title:subtitle": "Part I"
---

Hello`,
      oldKey: "title:subtitle",
      newKey: "title_subtitle",
      output: `---
title_subtitle: "Part I"
---

Hello`,
    },
  ])
})
