import { micromark } from "micromark"
import { expect, test } from "vitest"
import { noteEmbed, noteEmbedHtml } from "./note-embed"

function runTests(tests: Array<{ input: string; output: string }>) {
  for (const { input, output } of tests) {
    test(input, () => {
      const html = micromark(input, {
        extensions: [noteEmbed()],
        htmlExtensions: [noteEmbedHtml()],
      })
      expect(html).toBe(output)
    })
  }
}

runTests([
  // Valid note links
  {
    input: `![[123]]`,
    output: `<p><note-embed id="123" text="123" /></p>`,
  },
  {
    input: `[![[123]]]`,
    output: `<p>[<note-embed id="123" text="123" />]</p>`,
  },
  {
    input: `[[![[123]]]]`,
    output: `<p>[[<note-embed id="123" text="123" />]]</p>`,
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
    output: `<p><em><note-embed id="123" text="123" /></em></p>`,
  },
  {
    input: `- ![[123]]`,
    output: `<ul>
<li><note-embed id="123" text="123" /></li>
</ul>`,
  },
  {
    input: `![[123|hello]]`,
    output: `<p><note-embed id="123" text="hello" /></p>`,
  },
  {
    input: `![[123|hello world]]`,
    output: `<p><note-embed id="123" text="hello world" /></p>`,
  },
  {
    input: `![[123|hello]] ![[456]]`,
    output: `<p><note-embed id="123" text="hello" /> <note-embed id="456" text="456" /></p>`,
  },
  {
    input: `![[123x]]`,
    output: `<p><note-embed id="123x" text="123x" /></p>`,
  },
  {
    input: `![[x]]`,
    output: `<p><note-embed id="x" text="x" /></p>`,
  },
  {
    input: `![[x|y]]`,
    output: `<p><note-embed id="x" text="y" /></p>`,
  },
  {
    input: `![[Hello world|foo]]`,
    output: `<p><note-embed id="Hello world" text="foo" /></p>`,
  },
  {
    input: `![[foo.bar]]`,
    output: `<p><note-embed id="foo.bar" text="foo.bar" /></p>`,
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
