import { micromark } from "micromark"
import { expect, test } from "vitest"
import { noteLink, noteLinkHtml } from "./note-link"

function runTests(tests: Array<{ input: string; output: string }>) {
  for (const { input, output } of tests) {
    test(input, () => {
      const html = micromark(input, {
        extensions: [noteLink()],
        htmlExtensions: [noteLinkHtml()],
      })
      expect(html).toBe(output)
    })
  }
}

runTests([
  {
    input: `hello`,
    output: `<p>hello</p>`,
  },
  {
    input: `[`,
    output: `<p>[</p>`,
  },
  {
    input: `[[`,
    output: `<p>[[</p>`,
  },
  {
    input: `[[]]`,
    output: `<p>[[]]</p>`,
  },
  {
    input: `[[123]]`,
    output: `<p><note-link id="123" text="123" /></p>`,
  },
  {
    input: `[[123x]]`,
    output: `<p>[[123x]]</p>`,
  },
])
