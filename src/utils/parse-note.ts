import { fromMarkdown } from "mdast-util-from-markdown"
import { toString } from "mdast-util-to-string"
import { visit } from "unist-util-visit"
import { dateLink, dateLinkFromMarkdown } from "../remark-plugins/date-link"
import { noteLink, noteLinkFromMarkdown } from "../remark-plugins/note-link"
import { tagLink, tagLinkFromMarkdown } from "../remark-plugins/tag-link"
import { NoteId } from "../types"
import { parseFrontmatter } from "./parse-frontmatter"
import memoize from "fast-memoize"
import { getNextBirthday, toDateStringUtc } from "./date"

/**
 * Extract metadata from a note.
 *
 * We memoize this function because it's called a lot and it's expensive.
 * We're intentionally sacrificing memory usage for runtime performance.
 */
export const parseNote = memoize((rawBody: string) => {
  let title = ""
  const tags = new Set<string>()
  const dates = new Set<string>()
  const links = new Set<NoteId>()
  const queries = new Set<string>()

  const { frontmatter } = parseFrontmatter(rawBody)

  const mdast = fromMarkdown(rawBody, {
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
        dates.add(node.data.date)
        break
      }

      case "noteLink": {
        links.add(node.data.id.toString())
        break
      }

      case "tagLink": {
        // Add all parent tags (e.g. "foo/bar/baz" => "foo", "foo/bar", "foo/bar/baz")
        node.data.name.split("/").forEach((_, index) => {
          tags.add(
            node.data.name
              .split("/")
              .slice(0, index + 1)
              .join("/"),
          )
        })
        break
      }

      case "code": {
        if (node.lang === "query") {
          queries.add(node.value)
        }
      }
    }
  })

  // Check for dates in the frontmatter
  for (const value of Object.values(frontmatter)) {
    if (value instanceof Date) {
      dates.add(toDateStringUtc(value))
    }
  }

  // If `birthday` is set, add next birthday to dates
  if (
    frontmatter.birthday instanceof Date ||
    (typeof frontmatter.birthday === "string" && /^\d{2}-\d{2}$/.test(frontmatter.birthday))
  ) {
    const date =
      frontmatter.birthday instanceof Date
        ? frontmatter.birthday
        : new Date(`0000-${frontmatter.birthday}`)
    dates.add(toDateStringUtc(getNextBirthday(date)))
  }

  return {
    frontmatter,
    title,
    dates: Array.from(dates),
    links: Array.from(links),
    tags: Array.from(tags),
    queries: Array.from(queries),
  }
})
