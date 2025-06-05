import { describe, expect, it } from "vitest"
import { removeTemplateFrontmatter } from "./remove-template-frontmatter"

describe("removeTemplateFrontmatter", () => {
  it("removes the template block from frontmatter", () => {
    const input = `---
template:
  name: Book
foo: bar
---
content`

    const expected = `---
foo: bar
---
content`

    expect(removeTemplateFrontmatter(input)).toBe(expected)
  })

  it("returns the original content when no template block exists", () => {
    const input = `---
foo: bar
---
content`

    expect(removeTemplateFrontmatter(input)).toBe(input)
  })
})
