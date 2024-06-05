import memoize from "fast-memoize"
import { fromMarkdown } from "mdast-util-from-markdown"
import { Node } from "mdast-util-from-markdown/lib"
import { gfmTaskListItemFromMarkdown } from "mdast-util-gfm-task-list-item"
import { toString } from "mdast-util-to-string"
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item"
import { visit } from "unist-util-visit"
import { z } from "zod"
import { embed, embedFromMarkdown } from "../remark-plugins/embed"
import { tag, tagFromMarkdown } from "../remark-plugins/tag"
import { wikilink, wikilinkFromMarkdown } from "../remark-plugins/wikilink"
import { NoteId } from "../schema"
import { getNextBirthday, isValidDateString, toDateStringUtc } from "./date"
import { parseFrontmatter } from "./parse-frontmatter"

/**
 * Extract metadata from a note.
 *
 * We memoize this function because it's called a lot and it's expensive.
 * We're intentionally sacrificing memory usage for runtime performance.
 */
export const parseNote = memoize((text: string) => {
  let title = ""
  let url: string | null = null
  const tags = new Set<string>()
  const dates = new Set<string>()
  const links = new Set<NoteId>()
  let openTasks = 0

  const { frontmatter, content } = parseFrontmatter(text)

  function visitNode(node: Node) {
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

      case "embed":
      case "wikilink": {
        links.add(node.data.id)

        if (isValidDateString(node.data.id)) {
          dates.add(node.data.id)
        }
        break
      }

      case "tag": {
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

      case "listItem": {
        if (node.checked === false) {
          openTasks++
        }
        break
      }
    }
  }
  
  // It's important that embed is included after wikilink.
  // embed is a subset of wikilink. In other words, all embeds are also wikilinks.
  // If embed is included before wikilink, all embeds are parsed as wikilinks.
  const extensions = [gfmTaskListItem(), wikilink(), embed(), tag()]
  const mdastExtensions = [
    gfmTaskListItemFromMarkdown(),
    wikilinkFromMarkdown(),
    embedFromMarkdown(),
    tagFromMarkdown(),
  ]

  const contentMdast = fromMarkdown(
    content,
    // @ts-ignore TODO: Fix types
    { extensions, mdastExtensions },
  )

  visit(contentMdast, visitNode)

  // Parse frontmatter as markdown to find things like wikilinks and tags
  const frontmatterString = text.slice(0, text.length - content.length)
  const frontmatterMdast = fromMarkdown(
    frontmatterString,
    // @ts-ignore TODO: Fix types
    { extensions, mdastExtensions },
  )

  visit(frontmatterMdast, visitNode)

  // Check for dates in the frontmatter
  for (const value of Object.values(frontmatter)) {
    if (value instanceof Date) {
      const date = toDateStringUtc(value)
      dates.add(date)
      links.add(date)
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
    const nextBirthday = toDateStringUtc(getNextBirthday(date))
    dates.add(nextBirthday)
    links.add(nextBirthday)
  }

  // Add tags from frontmatter
  const tagsSchema = z.array(z.string().regex(/^[a-zA-Z][\w-/]*$/))
  const parsedTags = tagsSchema.safeParse(frontmatter.tags)

  if (parsedTags.success) {
    // Add all parent tags (e.g. "foo/bar/baz" => "foo", "foo/bar", "foo/bar/baz")
    parsedTags.data.forEach((tag) =>
      tag.split("/").forEach((_, index) => {
        tags.add(
          tag
            .split("/")
            .slice(0, index + 1)
            .join("/"),
        )
      }),
    )
  }

  return {
    frontmatter,
    title,
    url,
    dates: Array.from(dates),
    links: Array.from(links),
    tags: Array.from(tags),
    openTasks,
  }
})
