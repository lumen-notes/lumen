import memoize from "fast-memoize"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmTaskListItemFromMarkdown } from "mdast-util-gfm-task-list-item"
import { toString } from "mdast-util-to-string"
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item"
import { visit } from "unist-util-visit"
import { z } from "zod"
import { noteEmbed, noteEmbedFromMarkdown } from "../remark-plugins/note-embed"
import { noteLink, noteLinkFromMarkdown } from "../remark-plugins/note-link"
import { tagLink, tagLinkFromMarkdown } from "../remark-plugins/tag-link"
import { NoteId } from "../schema"
import { getNextBirthday, isValidDateString, toDateStringUtc } from "./date"
import { parseFrontmatter } from "./parse-frontmatter"

/**
 * Extract metadata from a note.
 *
 * We memoize this function because it's called a lot and it's expensive.
 * We're intentionally sacrificing memory usage for runtime performance.
 */
export const parseNote = memoize((id: NoteId, content: string) => {
  let title = ""
  let url: string | null = null
  const tags = new Set<string>()
  const dates = new Set<string>()
  const links = new Set<NoteId>()

  const { frontmatter } = parseFrontmatter(content)

  const mdast = fromMarkdown(
    content,
    // @ts-ignore TODO: Fix types
    {
      // It's important that noteEmbed is included after noteLink.
      // noteEmbed is a subset of noteLink. In other words, all noteEmbeds are also noteLinks.
      // If noteEmbed is included before noteLink, all noteEmbeds are parsed as noteLinks.
      extensions: [gfmTaskListItem(), noteLink(), noteEmbed(), tagLink()],
      mdastExtensions: [
        gfmTaskListItemFromMarkdown(),
        noteLinkFromMarkdown(),
        noteEmbedFromMarkdown(),
        tagLinkFromMarkdown(),
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

      // noteEmbed is a subset of noteLink. In other words, all noteEmbeds are also noteLinks.
      case "noteEmbed":
      case "noteLink": {
        links.add(node.data.id)

        if (isValidDateString(node.data.id)) {
          dates.add(node.data.id)
        }
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
    }
  })

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
  }
})
