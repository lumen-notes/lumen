import { micromark } from "micromark"
import { expect, test } from "vitest"
import { embed, embedHtml } from "./embed"

function runTests(tests: Array<{ input: string; output: string }>) {
  for (const { input, output } of tests) {
    test(input, () => {
      const html = micromark(input, {
        extensions: [embed()],
        htmlExtensions: [embedHtml()],
      })
      expect(html).toBe(output)
    })
  }
}

runTests([
  // Valid note links
  {
    input: `![[123]]`,
    output: `<p><embed id="123" text="123" /></p>`,
  },
  {
    input: `[![[123]]]`,
    output: `<p>[<embed id="123" text="123" />]</p>`,
  },
  {
    input: `[[![[123]]]]`,
    output: `<p>[[<embed id="123" text="123" />]]</p>`,
  },
  {
    input: `\`\`\`
![[123]]
\`\`\``,
    output: `<pre><code>![[123]]
</code></pre>`,
  },
  {
    input: `\`![[123]]\``,
    output: `<p><code>![[123]]</code></p>`,
  },
  {
    input: `_![[123]]_`,
    output: `<p><em><embed id="123" text="123" /></em></p>`,
  },
  {
    input: `- ![[123]]`,
    output: `<ul>
<li><embed id="123" text="123" /></li>
</ul>`,
  },
  {
    input: `![[123|hello]]`,
    output: `<p><embed id="123" text="hello" /></p>`,
  },
  {
    input: `![[123|hello world]]`,
    output: `<p><embed id="123" text="hello world" /></p>`,
  },
  {
    input: `![[123|hello]] ![[456]]`,
    output: `<p><embed id="123" text="hello" /> <embed id="456" text="456" /></p>`,
  },
  {
    input: `![[123x]]`,
    output: `<p><embed id="123x" text="123x" /></p>`,
  },
  {
    input: `![[x]]`,
    output: `<p><embed id="x" text="x" /></p>`,
  },
  {
    input: `![[x|y]]`,
    output: `<p><embed id="x" text="y" /></p>`,
  },
  {
    input: `![[Hello world|foo]]`,
    output: `<p><embed id="Hello world" text="foo" /></p>`,
  },
  {
    input: `![[foo.bar]]`,
    output: `<p><embed id="foo.bar" text="foo.bar" /></p>`,
  },

  // Invalid note links
  {
    input: `hello`,
    output: `<p>hello</p>`,
  },
  {
    input: `[[123]]`,
    output: `<p>[[123]]</p>`,
  },
  {
    input: `[`,
    output: `<p>[</p>`,
  },
  {
    input: `![[`,
    output: `<p>![[</p>`,
  },
  {
    input: `![[]]`,
    output: `<p>![[]]</p>`,
  },
  {
    input: `![[123]`,
    output: `<p>![[123]</p>`,
  },
  {
    input: `![[123`,
    output: `<p>![[123</p>`,
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
    input: `![[123|]]`,
    output: `<p>![[123|]]</p>`,
  },
])
