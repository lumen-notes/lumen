import { expect, test } from "vitest"
import { updateTag } from "./update-tag"

type TestCase = {
  input: Parameters<typeof updateTag>[0]
  output: ReturnType<typeof updateTag>
}

function runTests(tests: TestCase[]) {
  for (const { input, output } of tests) {
    test(JSON.stringify(input), () => {
      const result = updateTag(input)
      expect(result).toBe(output)
    })
  }
}

runTests([
  // Rename tag
  {
    input: {
      fileContent: "#old-tag",
      oldName: "old-tag",
      newName: "new-tag",
    },
    output: "#new-tag",
  },
  {
    input: {
      fileContent: "#old-tag #other-tag",
      oldName: "old-tag",
      newName: "new-tag",
    },
    output: "#new-tag #other-tag",
  },
  {
    input: {
      fileContent: "#old-tag#other-tag",
      oldName: "old-tag",
      newName: "new-tag",
    },
    output: "#new-tag#other-tag",
  },
  {
    input: {
      fileContent: "#first-tag #second-tag #third-tag",
      oldName: "second-tag",
      newName: "new-tag",
    },
    output: "#first-tag #new-tag #third-tag",
  },
  {
    input: {
      fileContent: "#first-tagsecond-tag #third-tag",
      oldName: "first-tag",
      newName: "new-tag",
    },
    output: "#first-tagsecond-tag #third-tag",
  },
  {
    input: {
      fileContent: `---
tags: [old-tag, other-tag]
---`,
      oldName: "old-tag",
      newName: "new-tag",
    },
    output: `---
tags: [new-tag, other-tag]
---`,
  },
  {
    input: {
      fileContent: `---
tags: [first-tag, second-tag, third-tag]
---`,
      oldName: "second-tag",
      newName: "new-tag",
    },
    output: `---
tags: [first-tag, new-tag, third-tag]
---`,
  },
  {
    input: {
      fileContent: `---
foo: bar
tags: [first-tag, second-tag, third-tag]
---`,
      oldName: "second-tag",
      newName: "new-tag",
    },
    output: `---
foo: bar
tags: [first-tag, new-tag, third-tag]
---`,
  },
  {
    input: {
      fileContent: `---
tags: [first-tagsecond-tag, third-tag]
---`,
      oldName: "second-tag",
      newName: "new-tag",
    },
    output: `---
tags: [first-tagsecond-tag, third-tag]
---`,
  },
  {
    input: {
      fileContent: "No tags present",
      oldName: "old-tag",
      newName: "new-tag",
    },
    output: "No tags present",
  },

  // Delete tag
  {
    input: {
      fileContent: "#old-tag",
      oldName: "old-tag",
      newName: null,
    },
    output: "",
  },
  {
    input: {
      fileContent: "#old-tag #other-tag",
      oldName: "old-tag",
      newName: null,
    },
    output: " #other-tag",
  },
  {
    input: {
      fileContent: `---
tags: [old-tag]
---`,
      oldName: "old-tag",
      newName: null,
    },
    output: `---
tags: []
---`,
  },
  {
    input: {
      fileContent: `---
tags: [old-tag, other-tag]
---`,
      oldName: "old-tag",
      newName: null,
    },
    output: `---
tags: [other-tag]
---`,
  },
  {
    input: {
      fileContent: `---
tags: [first-tag, second-tag, third-tag]
---`,
      oldName: "second-tag",
      newName: null,
    },
    output: `---
tags: [first-tag, third-tag]
---`,
  },
  {
    input: {
      fileContent: `---
tags: [first-tag, second-tag, third-tag]
---`,
      oldName: "third-tag",
      newName: null,
    },
    output: `---
tags: [first-tag, second-tag]
---`,
  },
  {
    input: {
      fileContent: "No tags present",
      oldName: "old-tag",
      newName: null,
    },
    output: "No tags present",
  },
])
