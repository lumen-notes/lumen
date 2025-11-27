import { micromark } from "micromark"
import { expect, test, describe } from "vitest"
import { priority, priorityHtml } from "./priority"

function runTests(tests: Array<{ input: string; output: string }>) {
  for (const { input, output } of tests) {
    test(input, () => {
      const html = micromark(input, {
        extensions: [priority()],
        htmlExtensions: [priorityHtml()],
      })
      expect(html).toBe(output)
    })
  }
}

describe("priority parsing", () => {
  runTests([
    // Valid priority markers
    {
      input: `!!1`,
      output: `<p><priority level="1" /></p>`,
    },
    {
      input: `!!2`,
      output: `<p><priority level="2" /></p>`,
    },
    {
      input: `!!3`,
      output: `<p><priority level="3" /></p>`,
    },
    {
      input: `Hello !!1 world`,
      output: `<p>Hello <priority level="1" /> world</p>`,
    },
    {
      input: `!!1 !!2 !!3`,
      output: `<p><priority level="1" /> <priority level="2" /> <priority level="3" /></p>`,
    },
    {
      input: `Task !!2 with priority`,
      output: `<p>Task <priority level="2" /> with priority</p>`,
    },
    // Invalid priority markers (should not be parsed as priority)
    {
      input: `!1`,
      output: `<p>!1</p>`,
    },
    {
      input: `!!`,
      output: `<p>!!</p>`,
    },
    {
      input: `!!4`,
      output: `<p>!!4</p>`,
    },
    {
      input: `!!0`,
      output: `<p>!!0</p>`,
    },
    {
      input: `!!!1`,
      output: `<p>!<priority level="1" /></p>`,
    },
  ])
})
