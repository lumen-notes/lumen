import { request } from "@octokit/request"
import { fromMarkdown } from "mdast-util-from-markdown"
import { visit } from "unist-util-visit"
import { wikilink, wikilinkFromMarkdown } from "../remark-plugins/wikilink"
import { Note } from "../schema"

export async function createGist({ githubToken, note }: { githubToken: string; note: Note }) {
  const filename = `${note.id}.md`

  try {
    const response = await request("POST /gists", {
      headers: {
        authorization: `token ${githubToken}`,
      },
      public: false,
      files: {
        [filename]: {
          content: transformMarkdown(note.content),
        },
      },
    })

    return response.data
  } catch (error) {
    console.error("Failed to create gist:", error)
    return null
  }
}

export async function updateGist({
  githubToken,
  gistId,
  note,
}: {
  githubToken: string
  gistId: string
  note: Note
}) {
  const filename = `${note.id}.md`

  try {
    const response = await request("PATCH /gists/{gist_id}", {
      headers: {
        authorization: `token ${githubToken}`,
      },
      gist_id: gistId,
      files: {
        [filename]: {
          content: transformMarkdown(note.content),
        },
      },
    })

    return response.data
  } catch (error) {
    console.error("Failed to update gist:", error)
    return null
  }
}

export async function deleteGist({ githubToken, gistId }: { githubToken: string; gistId: string }) {
  try {
    const response = await request("DELETE /gists/{gist_id}", {
      headers: {
        authorization: `token ${githubToken}`,
      },
      gist_id: gistId,
    })

    return response.status === 204
  } catch (error) {
    console.error("Failed to delete gist:", error)
    return false
  }
}

/**
 * Transforms markdown content by replacing wikilinks with their text representation
 *
 * "[[1234]]" → "1234"
 * "[[1234|My note]]" → "My note"
 */
function transformMarkdown(content: string): string {
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
    const text = node.data.text || node.data.id

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
