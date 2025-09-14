import { describe, test, expect } from "vitest"
import { updateFrontmatter } from "./frontmatter"

describe("updateFrontmatter", () => {
  function runTests(
    tests: {
      content: string
      properties: Record<string, string | boolean | number | null>
      output: string
    }[],
  ) {
    for (const { content, properties, output } of tests) {
      test(JSON.stringify({ content, properties }), () => {
        const result = updateFrontmatter({ content, properties })
        expect(result).toBe(output)
      })
    }
  }

  runTests([
    // Add new frontmatter
    {
      content: "Hello",
      properties: { title: "Test" },
      output: `---
title: "Test"
---

Hello`,
    },
    // Handle empty string values
    {
      content: "Hello",
      properties: { title: "" },
      output: `---
title: ""
---

Hello`,
    },
    // Update existing frontmatter
    {
      content: `---
title: Old
---

Hello`,
      properties: { title: "New" },
      output: `---
title: "New"
---

Hello`,
    },
    // Add new property to existing frontmatter
    {
      content: `---
title: Test
---

Hello`,
      properties: { tags: "test" },
      output: `---
title: Test
tags: "test"
---

Hello`,
    },
    // Remove property using null
    {
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
    // Update multiple properties
    {
      content: `---
title: Test
tags: old
---

Hello`,
      properties: { title: "New", tags: "new" },
      output: `---
title: "New"
tags: "new"
---

Hello`,
    },
    // Handle boolean values
    {
      content: "Hello",
      properties: { draft: true },
      output: `---
draft: true
---

Hello`,
    },
    // Handle number values
    {
      content: "Hello",
      properties: { priority: 1 },
      output: `---
priority: 1
---

Hello`,
    },
    // Remove all properties
    {
      content: `---
title: Test
tags: test
---

Hello`,
      properties: { title: null, tags: null },
      output: "Hello",
    },
    // Empty content with frontmatter
    {
      content: "",
      properties: { title: "Test" },
      output: `---
title: "Test"
---

`,
    },
  ])
})
