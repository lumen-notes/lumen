import { describe, test, expect } from "vitest"
import { togglePin } from "./pin"

describe("togglePin", () => {
  function runTests(tests: { input: string; output: string }[]) {
    for (const { input, output } of tests) {
      test(JSON.stringify(input), () => {
        const result = togglePin(input)
        expect(result).toBe(output)
      })
    }
  }

  runTests([
    // Add pin
    {
      input: `Hello`,
      output: `---
pinned: true
---

Hello`,
    },
    {
      input: `---
pinned: false
---

Hello`,
      output: `---
pinned: true
---

Hello`,
    },
    {
      input: `---
pinned: ok
---

Hello`,
      output: `---
pinned: true
---

Hello`,
    },
    {
      input: `---
tags: [some-tag]
---

Hello`,
      output: `---
tags: [some-tag]
pinned: true
---

Hello`,
    },

    // Remove pin
    {
      input: `---
pinned: true
---

Hello`,
      output: `Hello`,
    },
    {
      input: `---
pinned: true
---`,
      output: ``,
    },
    {
      input: `---
pinned: true
---

Hello`,
      output: `Hello`,
    },
    {
      input: `---
tags: [some-tag]
pinned: true
---

Hello`,
      output: `---
tags: [some-tag]
---

Hello`,
    },
  ])
})
