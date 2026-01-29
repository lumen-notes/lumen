import { fromMarkdown } from "mdast-util-from-markdown"
import { visit } from "unist-util-visit"
import { embed, embedFromMarkdown } from "../remark-plugins/embed"
import { NoteId, Note } from "../schema"

/**
 * Replaces note embeds with their content as blockquotes
 *
 * "![[note-id]]" → "> note content line 1\n> note content line 2"
 * "![[note-id|Custom Text]]" → "> note content line 1\n> note content line 2"
 *
 * If the embedded note doesn't exist, the embed is removed.
 * Handles recursive embeds by processing embedded content.
 */
export function inlineNoteEmbeds(
  content: string,
  notes: Map<NoteId, Note>,
  maxDepth = 3,
): string {
  return inlineNoteEmbedsRecursive(content, notes, 0, maxDepth, new Set())
}

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

    const noteId = node.data.id

    // Get the embedded note
    const embeddedNote = notes.get(noteId)

    let replacementText = ""

    if (embeddedNote && !visitedNotes.has(noteId)) {
      // Mark this note as visited to prevent infinite loops
      const newVisitedNotes = new Set(visitedNotes)
      newVisitedNotes.add(noteId)

      // Get the note content (excluding frontmatter)
      let noteContent = getContentWithoutFrontmatter(embeddedNote.content)

      // Recursively process embeds in the embedded content
      noteContent = inlineNoteEmbedsRecursive(
        noteContent,
        notes,
        currentDepth + 1,
        maxDepth,
        newVisitedNotes,
      )

      // Convert to blockquote
      replacementText = contentToBlockquote(noteContent)
    }

    // Add the replacement to our list
    replacements.push({
      start: node.position.start.offset!,
      end: node.position.end.offset!,
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
 * Removes YAML frontmatter from content if present
 */
function getContentWithoutFrontmatter(content: string): string {
  // Check if content starts with frontmatter delimiter
  if (!content.startsWith("---")) {
    return content.trim()
  }

  // Find the closing delimiter
  const endIndex = content.indexOf("\n---", 3)
  if (endIndex === -1) {
    return content.trim()
  }

  // Return content after frontmatter, trimmed
  return content.slice(endIndex + 4).trim()
}

/**
 * Converts content to a markdown blockquote
 */
function contentToBlockquote(content: string): string {
  if (!content) return ""

  // Split into lines and prefix each with "> "
  const lines = content.split("\n")
  return lines.map((line) => `> ${line}`).join("\n")
}
