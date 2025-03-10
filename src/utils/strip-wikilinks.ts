import { fromMarkdown } from "mdast-util-from-markdown"
import { visit } from "unist-util-visit"
import { wikilink, wikilinkFromMarkdown } from "../remark-plugins/wikilink"
import { formatDate, formatWeek, isValidDateString, isValidWeekString } from "./date"

/**
 * Replaces wikilinks with their text representation
 *
 * "[[1234]]" → "1234"
 * "[[1234|My note]]" → "My note"
 */
export function stripWikilinks(content: string): string {
  // Parse the markdown content with wikilink support
  const mdast = fromMarkdown(content, {
    extensions: [wikilink()],
    mdastExtensions: [wikilinkFromMarkdown()],
  })

  // Keep track of replacements to make
  const replacements: Array<{ start: number; end: number; text: string }> = []

  // Visit all wikilink nodes
  visit(mdast, "wikilink", (node) => {
    if (!node.position) return

    // Get the text to replace the wikilink with
    let text = node.data.text
    if (!text) {
      if (isValidDateString(node.data.id)) {
        // If ID is a valid date, format the date
        text = formatDate(node.data.id, { alwaysIncludeYear: true })
      } else if (isValidWeekString(node.data.id)) {
        // If ID is a valid week, format the week
        text = formatWeek(node.data.id)
      } else {
        text = node.data.id
      }
    }

    // Add the replacement to our list
    replacements.push({
      start: node.position.start.offset!,
      end: node.position.end.offset!,
      text,
    })
  })

  // Apply replacements in reverse order to not affect other replacement positions
  replacements.sort((a, b) => b.start - a.start)

  // Make the replacements
  let result = content
  for (const { start, end, text } of replacements) {
    result = result.slice(0, start) + text + result.slice(end)
  }

  return result
}
