import { micromark } from "micromark"
import { expect, test } from "vitest"
import { tagLink, tagLinkHtml } from "./tag-link"

function runTests(tests: Array<{ input: string; output: string }>) {
  for (const { input, output } of tests) {
    test(input, () => {
      const html = micromark(input, {
        extensions: [tagLink()],
        htmlExtensions: [tagLinkHtml()],
      })
      expect(html).toBe(output)
    })
  }
}

runTests([
  // Valid tag links
  {
    input: `#hello`,
    output: `<p><tag-link name="hello" /></p>`,
  },
  {
    input: `#HELLO`,
    output: `<p><tag-link name="HELLO" /></p>`,
  },
  {
    input: `# #hello`,
    output: `<h1><tag-link name="hello" /></h1>`,
  },
  {
    input: `#hello#world`,
    output: `<p><tag-link name="hello" />#world</p>`,
  },
  {
    input: `#hello #world`,
    output: `<p><tag-link name="hello" /> <tag-link name="world" /></p>`,
  },
  {
    input: `hello #world`,
    output: `<p>hello <tag-link name="world" /></p>`,
  },
  {
    input: `hello

#world`,
    output: `<p>hello</p>
<p><tag-link name="world" /></p>`,
  },

  {
    input: `#hello-world`,
    output: `<p><tag-link name="hello-world" /></p>`,
  },
  {
    input: `#hello_world`,
    output: `<p><tag-link name="hello_world" /></p>`,
  },
  {
    input: `#tag0123456789`,
    output: `<p><tag-link name="tag0123456789" /></p>`,
  },
  {
    input: `#hello!`,
    output: `<p><tag-link name="hello" />!</p>`,
  },
  {
    input: `#hello world`,
    output: `<p><tag-link name="hello" /> world</p>`,
  },
  {
    input: `- #hello`,
    output: `<ul>
<li><tag-link name="hello" /></li>
</ul>`,
  },
  {
    input: `> #hello`,
    output: `<blockquote>
<p><tag-link name="hello" /></p>
</blockquote>`,
  },

  // Invalid tag links
  {
    input: `#`,
    output: `<h1></h1>`,
  },
  {
    input: `# hello`,
    output: `<h1>hello</h1>`,
  },
  {
    input: `&#39;`,
    output: `<p>'</p>`,
  },
  {
    input: `![#hello](https://example.com/image.png)`,
    output: `<p><img src="https://example.com/image.png" alt="#hello" /></p>`,
  },
  {
    input: `[#hello](https://example.com)`,
    output: `<p><a href="https://example.com">#hello</a></p>`,
  },
  {
    input: `[link](#hello)`,
    output: `<p><a href="#hello">link</a></p>`,
  },
  {
    input: `_#hello_`,
    output: `<p><em>#hello</em></p>`,
  },
  {
    input: `__#hello__`,
    output: `<p><strong>#hello</strong></p>`,
  },
  {
    input: `#0123456789`,
    output: `<p>#0123456789</p>`,
  },
  {
    input: `\`\`\`
#hello
\`\`\``,
    output: `<pre><code>#hello
</code></pre>`,
  },
  {
    input: `\\#hello`,
    output: `<p>#hello</p>`,
  },
  {
    input: `##hello`,
    output: `<p>##hello</p>`,
  },
])
