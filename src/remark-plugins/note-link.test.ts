import { micromark } from "micromark"
import { expect, test } from "vitest"
import { noteLink, noteLinkHtml } from "./note-link"

test("noteLink", () => {
  const html = micromark("hello [", {
    extensions: [noteLink()],
    htmlExtensions: [noteLinkHtml()],
  })

  expect(html).toBe("<p>hello <note-link></note-link></p>")
})
