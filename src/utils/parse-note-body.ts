import { fromMarkdown } from "mdast-util-from-markdown"
import { toString } from "mdast-util-to-string"
import { visit } from "unist-util-visit"
import { dateLink, dateLinkFromMarkdown } from "../remark-plugins/date-link"
import { noteLink, noteLinkFromMarkdown } from "../remark-plugins/note-link"
import { tagLink, tagLinkFromMarkdown } from "../remark-plugins/tag-link"
import { NoteId } from "../types"
import { parseFrontmatter } from "./parse-frontmatter"

/** Extracts metadata from a note body */
export function parseNoteBody(body: string) {
  let title = ""
  const noteLinks: NoteId[] = []
  const tagLinks: string[] = []
  const dateLinks: string[] = []

  const { frontmatter, content } = parseFrontmatter(body)

  const mdast = fromMarkdown(content, {
    extensions: [noteLink(), tagLink(), dateLink()],
    mdastExtensions: [noteLinkFromMarkdown(), tagLinkFromMarkdown(), dateLinkFromMarkdown()],
  })

  visit(mdast, (node) => {
    switch (node.type) {
      case "heading": {
        if (node.depth === 1 && !title) {
          title = toString(node)
        }
        break
      }
      case "noteLink": {
        noteLinks.push(node.data.id.toString())
        break
      }
      case "tagLink": {
        tagLinks.push(node.data.name)
        break
      }
      case "dateLink": {
        dateLinks.push(node.data.date)
        break
      }
    }
  })

  return { title, noteLinks, tagLinks, dateLinks, frontmatter }
}
