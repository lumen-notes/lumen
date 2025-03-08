import { request } from "@octokit/request"
import { fromMarkdown } from "mdast-util-from-markdown"
import { visit } from "unist-util-visit"
import { wikilink, wikilinkFromMarkdown } from "../remark-plugins/wikilink"
import { GitHubUser, Note } from "../schema"
import { formatDate, formatWeek, isValidDateString, isValidWeekString } from "./date"
import { Link, Image, Text } from "mdast"

export async function createGist({ note, githubUser }: { note: Note; githubUser: GitHubUser }) {
  const filename = `${note.id}.md`

  try {
    const response = await request("POST /gists", {
      headers: {
        authorization: `token ${githubUser.token}`,
      },
      public: false,
      files: {
        [filename]: {
          content: stripWikilinks(note.content),
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
  gistId,
  note,
  githubUser,
}: {
  gistId: string
  note: Note
  githubUser: GitHubUser
}) {
  const filename = `${note.id}.md`

  try {
    // We only transform upload URLs during update (not create) because the gistId
    // doesn't exist during creation, and uploads need the gistId to generate
    // proper GitHub raw content URLs
    const transformedContent = transformUploadUrls({
      content: stripWikilinks(note.content),
      gistId,
      gistOwner: githubUser.login,
    })

    const response = await request("PATCH /gists/{gist_id}", {
      headers: {
        authorization: `token ${githubUser.token}`,
      },
      gist_id: gistId,
      files: {
        [filename]: {
          content: transformedContent,
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

/**
 * Transforms URLs in markdown content that point to /uploads/* to gist raw URLs
 */
export function transformUploadUrls({
  content,
  gistId,
  gistOwner,
}: {
  content: string
  gistId: string
  gistOwner: string
}): string {
  const mdast = fromMarkdown(content)
  const replacements: Array<{ start: number; end: number; text: string }> = []

  // Visit all link and image nodes
  visit(mdast, (node) => {
    if (node.type !== "link" && node.type !== "image") return
    if (!node.position || !node.url.startsWith("/uploads/")) return

    // Transform the URL to a gist raw URL
    const fileName = node.url.split("/").pop()
    const newUrl = `https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/${fileName}`

    // Add the replacement to our list
    replacements.push({
      start: node.position.start.offset!,
      end: node.position.end.offset!,
      text:
        node.type === "image"
          ? `![${(node as Image).alt || ""}](${newUrl})`
          : `[${((node as Link).children[0] as Text)?.value || ""}](${newUrl})`,
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
