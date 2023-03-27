import { fromMarkdown } from "mdast-util-from-markdown"
import { toString } from "mdast-util-to-string"
import { visit } from "unist-util-visit"
import { dateLink, dateLinkFromMarkdown } from "../remark-plugins/date-link"
import { noteLink, noteLinkFromMarkdown } from "../remark-plugins/note-link"
import { tagLink, tagLinkFromMarkdown } from "../remark-plugins/tag-link"
import { NoteId } from "../types"
import { parseFrontmatter } from "./parse-frontmatter"
import memoize from "fast-memoize"

/**
 * Extract metadata from a note.
 *
 * We memoize this function because it's called a lot and it's expensive.
 * We're intentionally sacrificing memory usage for runtime performance.
 */
export const parseNote = memoize((rawBody: string) => {
  let title = ""
  const tags: string[] = []
  const dates: string[] = []
  const links: NoteId[] = []

  const { frontmatter, content } = parseFrontmatter(rawBody)

  const mdast = fromMarkdown(content, {
    extensions: [dateLink(), noteLink(), tagLink()],
    mdastExtensions: [dateLinkFromMarkdown(), noteLinkFromMarkdown(), tagLinkFromMarkdown()],
  })

  visit(mdast, (node) => {
    switch (node.type) {
      case "heading": {
        if (node.depth === 1 && !title) {
          title = toString(node)
        }
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

      case "tagLink": {
        tags.push(node.data.name)
        break
      }
    }
  })

  return { frontmatter, title, dates, links, tags }
})
