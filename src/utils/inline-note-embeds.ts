import { fromMarkdown } from "mdast-util-from-markdown"
import { visit } from "unist-util-visit"
import { embed, embedFromMarkdown } from "../remark-plugins/embed"
import { NoteId, Note } from "../schema"
import { parseFrontmatter } from "./frontmatter"

/**
 * Replaces note embeds with their content as blockquotes
 *
 * "![[note-id]]" → "> note content line 1\n> note content line 2"
 * "![[note-id|Custom Text]]" → "> note content line 1\n> note content line 2"
 *
 * If the embedded note doesn't exist, the embed is removed.
 * Handles recursive embeds by processing embedded content.
 */
export function inlineNoteEmbeds(content: string, notes: Map<NoteId, Note>, maxDepth = 3): string {
  return inlineNoteEmbedsRecursive(content, notes, 0, maxDepth, new Set())
}

const TABLE_ROW_REGEX = /^\s*\|.*\|\s*$/

function inlineNoteEmbedsRecursive(
  content: string,
  notes: Map<NoteId, Note>,
  currentDepth: number,
  maxDepth: number,
  visitedNotes: Set<NoteId>,
): string {
  // Stop recursion if max depth reached
  if (currentDepth >= maxDepth) {
    return content
  }

  // Parse the markdown content with embed support
  const mdast = fromMarkdown(content, {
    extensions: [embed()],
    mdastExtensions: [embedFromMarkdown()],
  })

  // Keep track of replacements to make
  const replacements: Array<{ start: number; end: number; text: string }> = []

  // Visit all embed nodes
  visit(mdast, "embed", (node) => {
    if (!node.position) return

    const startOffset = node.position.start.offset!
    const endOffset = node.position.end.offset!

    const lineStart = content.lastIndexOf("\n", startOffset - 1) + 1
    const lineEndIndex = content.indexOf("\n", endOffset)
    const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex
    const line = content.slice(lineStart, lineEnd)
    const positionInLine = startOffset - lineStart
    const linePrefix = line.slice(0, positionInLine)
    const lineSuffix = line.slice(positionInLine + (endOffset - startOffset))

    const noteId = node.data.id

    // Get the embedded note
    const embeddedNote = notes.get(noteId)

    let replacementText = ""
    let replacementStart = startOffset
    let replacementEnd = endOffset

    if (embeddedNote && !visitedNotes.has(noteId)) {
      const isTableRow = TABLE_ROW_REGEX.test(line)

      const quoteMatch = line.match(/^(\s*(?:>\s*)+)/)
      const quotePrefix = quoteMatch ? quoteMatch[1] : ""
      const lineAfterQuote = line.slice(quotePrefix.length)
      const linePrefixAfterQuote = linePrefix.slice(quotePrefix.length)

      const listMarkerMatch = lineAfterQuote.match(/^(\s*)(?:[-*+]|\d+\.)\s+/)
      const listMarkerLength = listMarkerMatch ? listMarkerMatch[0].length : 0
      const hasListMarkerBeforeEmbed =
        !!listMarkerMatch && linePrefixAfterQuote.length >= listMarkerLength

      const indentPrefix = hasListMarkerBeforeEmbed
        ? " ".repeat(listMarkerLength)
        : (linePrefixAfterQuote.match(/^\s*/)?.[0] ?? "")

      const prefixAfterStructure = hasListMarkerBeforeEmbed
        ? linePrefixAfterQuote.slice(listMarkerLength)
        : linePrefixAfterQuote

      const hasContentBefore = /\S/.test(prefixAfterStructure)
      const hasContentAfter = /\S/.test(lineSuffix)
      const contextPrefix = `${quotePrefix}${indentPrefix}`
      const continuationPrefix = hasContentAfter ? contextPrefix : ""

      // Mark this note as visited to prevent infinite loops
      const newVisitedNotes = new Set(visitedNotes)
      newVisitedNotes.add(noteId)

      // Get the note content (excluding frontmatter)
      let noteContent = parseFrontmatter(embeddedNote.content).content

      // Recursively process embeds in the embedded content
      noteContent = inlineNoteEmbedsRecursive(
        noteContent,
        notes,
        currentDepth + 1,
        maxDepth,
        newVisitedNotes,
      )

      if (noteContent.trim() !== "") {
        if (isTableRow) {
          replacementText = noteContent.replace(/\s*\n\s*/g, " ").trim()
        } else {
          const blockquoteContent = contentToBlockquote(noteContent, contextPrefix)
          const breakBefore = hasContentBefore ? `\n${contextPrefix}\n` : ""
          const breakAfter = hasContentAfter ? `\n${continuationPrefix}\n` : ""
          replacementText = `${breakBefore}${blockquoteContent}${breakAfter}${continuationPrefix}`

          if (hasContentBefore) {
            while (replacementStart > lineStart && /[ \t]/.test(content[replacementStart - 1])) {
              replacementStart -= 1
            }
          }

          if (hasContentAfter) {
            const whitespaceMatch = lineSuffix.match(/^\s+/)
            if (whitespaceMatch) {
              replacementEnd += whitespaceMatch[0].length
            }
          }
        }
      }
    }

    // Add the replacement to our list
    replacements.push({
      start: replacementStart,
      end: replacementEnd,
      text: replacementText,
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

/**
 * Converts content to a markdown blockquote
 */
function contentToBlockquote(content: string, linePrefix: string): string {
  if (!content) return ""

  // Split into lines and prefix each with "> "
  const lines = content.split("\n")
  return lines.map((line) => `${linePrefix}> ${line}`).join("\n")
}
