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
import { Note, NoteId, NoteType, Task, Template, templateSchema } from "../schema"
import {
  formatDate,
  formatWeek,
  getNextBirthday,
  isValidDateString,
  isValidWeekString,
  toDateStringUtc,
} from "./date"
import { parseFrontmatter } from "./frontmatter"
import { removeLeadingEmoji } from "./emoji"

/**
 * Extract metadata from a note.
 *
 * We memoize this function because it's called a lot and it's expensive.
 * We're intentionally sacrificing memory usage for runtime performance.
 */
export const parseNote = memoize((id: NoteId, content: string): Note => {
  let type: NoteType = "note"
  let displayName = ""
  let title = ""
  let url: string | null = null
  const tags = new Set<string>()
  const dates = new Set<string>()
  const links = new Set<NoteId>()
  const tasks: Task[] = []

  const { frontmatter, content: contentWithoutFrontmatter } = parseFrontmatter(content)

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
        if (typeof node.checked === "boolean") {
          tasks.push({
            completed: node.checked === true,
            text: toString(node),
          })
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
    contentWithoutFrontmatter,
    // @ts-ignore TODO: Fix types
    { extensions, mdastExtensions },
  )

  visit(contentMdast, visitNode)

  // Parse frontmatter as markdown to find things like wikilinks and tags
  const frontmatterString = content.slice(0, content.length - contentWithoutFrontmatter.length)
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
  const tagsSchema = z.array(z.string().regex(/^[\p{L}][\p{L}\p{N}_\-/]*$/u))
  const parsedTags = tagsSchema.safeParse(frontmatter.tags)

  if (parsedTags.success) {
    // Expand nested tags (e.g. "foo/bar/baz" => "foo", "foo/bar", "foo/bar/baz")
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

  // Determine the type of the note
  if (isValidDateString(id)) {
    type = "daily"
  } else if (isValidWeekString(id)) {
    type = "weekly"
  } else if (templateSchema.omit({ body: true }).safeParse(frontmatter.template).success) {
    type = "template"
  }

  switch (type) {
    case "daily":
      // Fallback to the formatted date if there's no title
      displayName = title ? removeLeadingEmoji(title) : formatDate(id)
      break
    case "weekly":
      // Fallback to the formatted week if there's no title
      displayName = title ? removeLeadingEmoji(title) : formatWeek(id)
      break
    case "template":
      displayName = `${(frontmatter.template as Template).name} template`
      break
    case "note":
      // If there's a title, use it as the display name
      if (title) {
        displayName = removeLeadingEmoji(title)
      }
      // If there's no title but the ID contains non-numeric characters, use that as the display name
      else if (id && !/^\d+$/.test(id)) {
        displayName = id
      }
      // For untitled notes with numeric IDs, we use the first 8 words as the title
      else {
        // Get clean text content without markdown syntax and split into words
        const words = toString(contentMdast).trim().split(/\s+/)
        const preview = words.slice(0, 8).join(" ")
        displayName = preview.length > 0 ? preview : "Empty note"
        // Add ellipsis if content was truncated
        if (words.length > 8) {
          displayName += "…"
        }
      }
      break
  }

  return {
    id,
    content,
    type,
    displayName,
    frontmatter,
    title,
    url,
    linkAlias: typeof frontmatter._link_alias === "string" ? frontmatter._link_alias : null,
    pinned: frontmatter.pinned === true,
    dates: Array.from(dates),
    links: Array.from(links),
    tags: Array.from(tags),
    tasks,
    backlinks: [],
  }
})
