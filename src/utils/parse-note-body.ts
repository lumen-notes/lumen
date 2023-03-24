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
  const tags: string[] = []
  const dates: string[] = []
  const links: NoteId[] = []

  const { frontmatter, content } = parseFrontmatter(body)

  const mdast = fromMarkdown(content, {
    extensions: [tagLink(), dateLink(), noteLink()],
    mdastExtensions: [tagLinkFromMarkdown(), dateLinkFromMarkdown(), noteLinkFromMarkdown()],
  })

  visit(mdast, (node) => {
    switch (node.type) {
      case "heading": {
        if (node.depth === 1 && !title) {
          title = toString(node)
        }
        break
      }
      case "tagLink": {
        tags.push(node.data.name)
        break
      }
      case "dateLink": {
        dates.push(node.data.date)
        break
      }
      case "noteLink": {
        links.push(node.data.id.toString())
        break
      }
    }
  })

  return { title, tags, dates, links, frontmatter }
}
