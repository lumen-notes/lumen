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
    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(expected)
    expect(result.uploadPaths).toEqual(["/uploads/image.png"])
  })

  it("should transform link URLs from uploads directory", () => {
    const input = `Here's a link: [Click here](/uploads/document.pdf)`
    const expected = `Here's a link: [Click here](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/document.pdf)`
    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(expected)
    expect(result.uploadPaths).toEqual(["/uploads/document.pdf"])
  })

  it("should transform HTML img tags from uploads directory", () => {
    const input = `Here's an HTML image: <img src="/uploads/image.png" alt="Alt text" />`
    const expected = `Here's an HTML image: <img src="https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/image.png" alt="Alt text" />`
    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(expected)
    expect(result.uploadPaths).toEqual(["/uploads/image.png"])
  })

  it("should transform non-self-closing HTML img tags", () => {
    const input = `Here's an HTML image: <img src="/uploads/image.png" alt="Alt text">`
    const expected = `Here's an HTML image: <img src="https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/image.png" alt="Alt text" />`
    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(expected)
    expect(result.uploadPaths).toEqual(["/uploads/image.png"])
  })

  it("should preserve HTML img attributes", () => {
    const input = `<img src="/uploads/image.png" alt="Alt text" width="100" height="100" class="my-class" />`
    const expected = `<img src="https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/image.png" alt="Alt text" width="100" height="100" class="my-class" />`
    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(expected)
    expect(result.uploadPaths).toEqual(["/uploads/image.png"])
  })

  it("should handle HTML img tags without alt attribute", () => {
    const input = `<img src="/uploads/image.png" width="100" />`
    const expected = `<img src="https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/image.png" width="100" />`
    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(expected)
    expect(result.uploadPaths).toEqual(["/uploads/image.png"])
  })

  it("should handle non-self-closing HTML img tags without attributes", () => {
    const input = `<img src="/uploads/image.png">`
    const expected = `<img src="https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/image.png" />`
    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(expected)
    expect(result.uploadPaths).toEqual(["/uploads/image.png"])
  })

  it("should not transform URLs not in uploads directory", () => {
    const input = "![image](https://example.com/image.png) and [link](https://example.com)"
    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(input)
    expect(result.uploadPaths).toEqual([])
  })

  it("should handle multiple uploads in the same content", () => {
    const input = `
![First](/uploads/first.png)
Some text
[Document](/uploads/doc.pdf)
More text
![Second](/uploads/second.jpg)
<img src="/uploads/third.png" alt="Third" />
<img src="/uploads/fourth.png" alt="Fourth">`

    const expected = `
![First](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/first.png)
Some text
[Document](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/doc.pdf)
More text
![Second](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/second.jpg)
<img src="https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/third.png" alt="Third" />
<img src="https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/fourth.png" alt="Fourth" />`

    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(expected)
    expect(result.uploadPaths).toEqual([
      "/uploads/first.png",
      "/uploads/doc.pdf",
      "/uploads/second.jpg",
      "/uploads/third.png",
      "/uploads/fourth.png",
    ])
  })

  it("should preserve alt text and link text", () => {
    const input = `![Custom Alt](/uploads/image.png) and [Custom Text](/uploads/file.pdf)`
    const expected = `![Custom Alt](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/image.png) and [Custom Text](https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/file.pdf)`
    const result = transformUploadUrls({ content: input, gistId, gistOwner })

    expect(result.content).toBe(expected)
    expect(result.uploadPaths).toEqual(["/uploads/image.png", "/uploads/file.pdf"])
  })

  it("should return a list of unique upload paths", () => {
    const input = `![First](/uploads/image.png) and [Document](/uploads/image.png) and <img src="/uploads/image.png" />`
    const result = transformUploadUrls({ content: input, gistId, gistOwner })
    expect(result.uploadPaths).toEqual(["/uploads/image.png"])
  })
})
