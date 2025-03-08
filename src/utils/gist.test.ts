import { describe, expect, it } from "vitest"
import { stripWikilinks, transformUploadUrls } from "./gist"

describe("stripWikilinks", () => {
  it("should replace basic wikilinks with their IDs", () => {
    const input = "Here is a [[1234]] wikilink"
    const expected = "Here is a 1234 wikilink"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should replace wikilinks with custom text", () => {
    const input = "Here is a [[1234|Custom Text]] wikilink"
    const expected = "Here is a Custom Text wikilink"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should format date wikilinks", () => {
    const input = "Meeting on [[2024-03-20]]"
    const expected = "Meeting on Wed, Mar 20, 2024"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should format week wikilinks", () => {
    const input = "Tasks for [[2024-W12]]"
    const expected = "Tasks for Week 12, 2024"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should handle multiple wikilinks in the same content", () => {
    const input = "[[1234]] and [[5678|Other Note]] and [[2024-03-20]]"
    const expected = "1234 and Other Note and Wed, Mar 20, 2024"
    expect(stripWikilinks(input)).toBe(expected)
  })

  it("should preserve non-wikilink content", () => {
    const input = "Regular text with *markdown* and [regular link](https://example.com)"
    expect(stripWikilinks(input)).toBe(input)
  })
})

describe("transformUploadUrls", () => {
  const gistId = "abc123"
  const gistOwner = "testuser"

  it("should transform image URLs from uploads directory", () => {
    const input = `Here's an image: ![Alt text](/uploads/image.png)`
    const expected = `Here's an image: ![Alt text](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/image.png)`

    expect(transformUploadUrls({ content: input, gistId, gistOwner })).toBe(expected)
  })

  it("should transform link URLs from uploads directory", () => {
    const input = `Here's a link: [Click here](/uploads/document.pdf)`
    const expected = `Here's a link: [Click here](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/document.pdf)`

    expect(transformUploadUrls({ content: input, gistId, gistOwner })).toBe(expected)
  })

  it("should not transform URLs not in uploads directory", () => {
    const input = "![image](https://example.com/image.png) and [link](https://example.com)"
    expect(transformUploadUrls({ content: input, gistId, gistOwner })).toBe(input)
  })

  it("should handle multiple uploads in the same content", () => {
    const input = `
![First](/uploads/first.png)
Some text
[Document](/uploads/doc.pdf)
More text
![Second](/uploads/second.jpg)`

    const expected = `
![First](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/first.png)
Some text
[Document](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/doc.pdf)
More text
![Second](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/second.jpg)`

    expect(transformUploadUrls({ content: input, gistId, gistOwner })).toBe(expected)
  })

  it("should preserve alt text and link text", () => {
    const input = `![Custom Alt](/uploads/image.png) and [Custom Text](/uploads/file.pdf)`
    const expected = `![Custom Alt](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/image.png) and [Custom Text](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/file.pdf)`

    expect(transformUploadUrls({ content: input, gistId, gistOwner })).toBe(expected)
  })
})
