import memoize from "fast-memoize"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmTaskListItemFromMarkdown } from "mdast-util-gfm-task-list-item"
import { toString } from "mdast-util-to-string"
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item"
import { visit } from "unist-util-visit"
import { dateLink, dateLinkFromMarkdown } from "../remark-plugins/date-link"
import { noteLink, noteLinkFromMarkdown } from "../remark-plugins/note-link"
import { tagLink, tagLinkFromMarkdown } from "../remark-plugins/tag-link"
import { NoteId, Task } from "../types"
import { getNextBirthday, toDateStringUtc } from "./date"
import { parseFrontmatter } from "./parse-frontmatter"

/**
 * Extract metadata from a note.
 *
 * We memoize this function because it's called a lot and it's expensive.
 * We're intentionally sacrificing memory usage for runtime performance.
 */
export const parseNote = memoize((id: NoteId, rawBody: string) => {
  let title = ""
  let url: string | null = null
  const tags = new Set<string>()
  const dates = new Set<string>()
  const links = new Set<NoteId>()
  const queries = new Set<string>()
  const tasks: Task[] = []

  const { frontmatter } = parseFrontmatter(rawBody)

  // Note: It's important that dateLink is included after noteLink.
  // dateLink is a subset of noteLink. In other words, all dateLinks are also noteLinks.
  // If dateLink is included before noteLink, all dateLinks are parsed as noteLinks.
  const mdast = fromMarkdown(
    rawBody,
    // @ts-ignore TODO: Fix types
    {
      extensions: [gfmTaskListItem(), noteLink(), tagLink(), dateLink()],
      mdastExtensions: [
        gfmTaskListItemFromMarkdown(),
        noteLinkFromMarkdown(),
        tagLinkFromMarkdown(),
        dateLinkFromMarkdown(),
      ],
    },
  )

  visit(mdast, (node) => {
    switch (node.type) {
      case "heading": {
        // Only use the first heading
        if (node.depth > 1 || title) return

        title = toString(node)

        // Is there a link in the title?
        if (node.children.length === 1 && node.children[0].type === "link") {
          url = node.children[0].url
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
        break
      }

      case "listItem": {
        // Task list item
        if (node.checked !== null && node.checked !== undefined) {
          if (!node.position?.start) break

          const text =
            rawBody
              .slice(node.position.start.offset, node.position?.end.offset)
              // "- [ ] Example" -> "Example"
              .match(/\[( |x)\] (?<rawBody>[^\n]+)\n?/)?.groups?.rawBody || ""

          const title =
            text
              // Remove dates
              .replace(/\[\[\d{4}-\d{2}-\d{2}\]\]/g, "")
              // Remove tags
              .replace(/#[a-zA-Z][\w-/]*/g, "")
              // Remove extra spaces
              .replace(/ +/g, " ")
              .trim() || ""

          const { dates, links, tags } = parseNote(id, text)

          tasks.push({
            noteId: id,
            start: node.position.start,
            rawBody: text,
            completed: node.checked,
            title,
            dates,
            links,
            tags,
          })
        }
        break
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
    url,
    dates: Array.from(dates),
    links: Array.from(links),
    tags: Array.from(tags),
    queries: Array.from(queries),
    tasks,
  }
})
