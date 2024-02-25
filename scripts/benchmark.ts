import Benchmark from "benchmark"
import { fromMarkdown } from "mdast-util-from-markdown"
import { wikilink, wikilinkFromMarkdown } from "../src/remark-plugins/wikilink"
import { tagLink, tagLinkFromMarkdown } from "../src/remark-plugins/tag-link"

const markdown = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

---

Paragraph with **bold** and *italic* and [link](https://example.com).

- List item 1
- List item 2
- List item 3

1. List item 1
2. List item 2
3. List item 3

> Blockquote

\`\`\`js
const foo = "bar"
\`\`\`

\`inline code\`

![image](https://example.com/image.png)

| Table | Header |
| ----- | ------ |
| Cell  | Cell   |

[[123456789|Note link]]

[[1998-7-11]]

#tag
`

const suite = new Benchmark.Suite("Markdown parsing")

suite.add("Without syntax extensions", () => {
  fromMarkdown(markdown)
})

suite.add("With tag link syntax", () => {
  fromMarkdown(markdown, {
    extensions: [tagLink()],
    mdastExtensions: [tagLinkFromMarkdown()],
  })
})

suite.add("With wikilink syntax", () => {
  fromMarkdown(markdown, {
    extensions: [wikilink()],
    mdastExtensions: [wikilinkFromMarkdown()],
  })
})

suite.add("With all syntax extensions", () => {
  fromMarkdown(markdown, {
    extensions: [wikilink(), tagLink()],
    mdastExtensions: [wikilinkFromMarkdown(), tagLinkFromMarkdown()],
  })
})

suite.on("complete", function () {
  const fastest: Benchmark = this.filter("fastest")[0]

  console.log(`## ${this.name}`)

  // Create markdown table
  console.log("| Test case | Ops/sec | Margin of error | Comparison |")
  console.log("| :-------- | :------ | :-------------- | :--------- |")

  this.forEach((benchmark: Benchmark) => {
    const isFastest = benchmark === fastest
    console.log(
      `| ${benchmark.name} | ${Benchmark.formatNumber(
        Math.round(benchmark.hz),
      )} ops/sec | ±${benchmark.stats.rme.toFixed(2)}% | ${
        isFastest ? "**Fastest**" : `${percentDecrease(fastest.hz, benchmark.hz)}% slower`
      } |`,
    )
  })
})

/** Calculate the percent decrease between two numbers */
function percentDecrease(a: number, b: number): number {
  return round(((a - b) / a) * 100, 2)
}

/** Round to the nearest given number of decimal places */
function round(value: number, decimals: number): number {
  return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals)
}

suite.run()
