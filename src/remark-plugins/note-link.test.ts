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
  // Valid
  {
    input: `[[123]]`,
    output: `<p><note-link id="123" text="123" /></p>`,
  },
  {
    input: `[[[123]]]`,
    output: `<p>[<note-link id="123" text="123" />]</p>`,
  },
  {
    input: `[[[[123]]]]`,
    output: `<p>[[<note-link id="123" text="123" />]]</p>`,
  },
  {
    input: `\`\`\`
[[123]]
\`\`\``,
    output: `<pre><code>[[123]]
</code></pre>`,
  },
  {
    input: `\`[[123]]\``,
    output: `<p><code>[[123]]</code></p>`,
  },
  {
    input: `_[[123]]_`,
    output: `<p><em><note-link id="123" text="123" /></em></p>`,
  },
  {
    input: `- [[123]]`,
    output: `<ul>
<li><note-link id="123" text="123" /></li>
</ul>`,
  },
  {
    input: `[[123|hello]]`,
    output: `<p><note-link id="123" text="hello" /></p>`,
  },
  {
    input: `[[123|hello world]]`,
    output: `<p><note-link id="123" text="hello world" /></p>`,
  },
  {
    input: `[[123|hello]] [[456]]`,
    output: `<p><note-link id="123" text="hello" /> <note-link id="456" text="456" /></p>`,
  },

  // Invalid
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
    input: `[[123x]]`,
    output: `<p>[[123x]]</p>`,
  },
  {
    input: `[[x]]`,
    output: `<p>[[x]]</p>`,
  },
  {
    input: `[[123]`,
    output: `<p>[[123]</p>`,
  },
  {
    input: `[[123`,
    output: `<p>[[123</p>`,
  },
  {
    input: `[123]]`,
    output: `<p>[123]]</p>`,
  },
  {
    input: `123]]`,
    output: `<p>123]]</p>`,
  },
  {
    input: `[123]`,
    output: `<p>[123]</p>`,
  },
  {
    input: `[[123|]]`,
    output: `<p>[[123|]]</p>`,
  },
])
