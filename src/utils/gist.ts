import LightningFS from "@isomorphic-git/lightning-fs"
import { request } from "@octokit/request"
import git from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { Image, Link, Text } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { visit } from "unist-util-visit"
import { wikilink, wikilinkFromMarkdown } from "../remark-plugins/wikilink"
import { GitHubRepository, GitHubUser, Note } from "../schema"
import { formatDate, formatWeek, isValidDateString, isValidWeekString } from "./date"
import { readFile } from "./fs"
import { REPO_DIR } from "./git"
import { isTrackedWithGitLfs, resolveGitLfsPointer } from "./git-lfs"

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

const GIST_DB_NAME = "gist"
const gistFs = new LightningFS(GIST_DB_NAME)

export async function updateGist({
  gistId,
  note,
  githubUser,
  githubRepo,
}: {
  gistId: string
  note: Note
  githubUser: GitHubUser
  githubRepo: GitHubRepository
}) {
  const filename = `${note.id}.md`
  const gistDir = `/tmp/gist-${gistId}`

  try {
    // Clone the gist repository
    await git.clone({
      fs: gistFs,
      http,
      dir: gistDir,
      corsProxy: "/cors-proxy",
      url: `https://gist.github.com/${gistId}.git`,
      singleBranch: true,
      depth: 1,
      onAuth: () => ({
        username: githubUser.login,
        password: githubUser.token,
      }),
    })

    // Transform upload URLs and get the list of files to upload
    const { content: transformedContent, uploadPaths } = transformUploadUrls({
      content: stripWikilinks(note.content),
      gistId,
      gistOwner: githubUser.login,
    })

    // Write the main note content
    await gistFs.promises.writeFile(`${gistDir}/${filename}`, transformedContent)

    // Add file uploads to the gist
    for (const path of uploadPaths) {
      const file = await readFile(`${REPO_DIR}${path}`)

      // If the file is tracked with Git LFS, resolve the pointer and fetch the binary file content
      if (await isTrackedWithGitLfs(path)) {
        const fileUrl = await resolveGitLfsPointer({
          file,
          githubUser,
          githubRepo,
        })

        // Fetch the binary file content
        const response = await fetch(`/file-proxy?url=${encodeURIComponent(fileUrl)}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch LFS file: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()

        await gistFs.promises.writeFile(`${gistDir}/${file.name}`, Buffer.from(arrayBuffer))
      } else {
        // Otherwise, read the file directly as a binary buffer
        const arrayBuffer = await file.arrayBuffer()
        await gistFs.promises.writeFile(`${gistDir}/${file.name}`, Buffer.from(arrayBuffer))
      }
    }

    // Stage all changes
    await git.add({
      fs: gistFs,
      dir: gistDir,
      filepath: ".",
    })

    // Create commit
    await git.commit({
      fs: gistFs,
      dir: gistDir,
      message: "Update note",
      author: {
        name: githubUser.login,
        email: githubUser.email,
      },
    })

    // Push changes
    await git.push({
      fs: gistFs,
      http,
      dir: gistDir,
      remote: "origin",
      onAuth: () => ({
        username: githubUser.login,
        password: githubUser.token,
      }),
    })
  } catch (error) {
    console.error("Failed to update gist:", error)
  }

  // Clean up
  window.indexedDB.deleteDatabase(GIST_DB_NAME)
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
 * and returns a list of unique file paths that need to be uploaded
 */
export function transformUploadUrls({
  content,
  gistId,
  gistOwner,
}: {
  content: string
  gistId: string
  gistOwner: string
}): { content: string; uploadPaths: string[] } {
  const mdast = fromMarkdown(content)
  const replacements: Array<{ start: number; end: number; text: string }> = []
  const uploadPaths = new Set<string>()

  // Visit all link and image nodes
  visit(mdast, (node) => {
    if (node.type !== "link" && node.type !== "image") return
    if (!node.position || !node.url.startsWith("/uploads/")) return

    // Transform the URL to a gist raw URL
    const fileName = node.url.split("/").pop()
    const newUrl = `https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/${fileName}`

    // Add the path to the uploadPaths set
    uploadPaths.add(node.url)

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

  // Transform HTML img tags
  const imgRegex = /<img([^>]+)src=["'](?<url>\/uploads\/[^"']+)["']([^>]*)>/g
  result = result.replace(imgRegex, (match, beforeSrc, url, afterSrc) => {
    // Transform the URL to a gist raw URL
    const fileName = url.split("/").pop()
    const newUrl = `https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/${fileName}`

    // Add the path to the uploadPaths set
    uploadPaths.add(url)

    // Get all attributes (before and after src)
    const attrs = (beforeSrc + " " + afterSrc)
      .replace(/\s+/g, " ")
      .replace(/\s*\/?\s*$/, "")
      .trim()

    // Reconstruct the img tag
    return `<img src="${newUrl}"${attrs ? ` ${attrs}` : ""} />`
  })

  return {
    content: result,
    uploadPaths: Array.from(uploadPaths),
  }
}
