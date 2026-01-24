import { Image, Link, Text } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { visit } from "unist-util-visit"
import { parseFrontmatter, updateFrontmatterValue } from "./frontmatter"

// Matches UPLOADS_DIR in src/hooks/attach-file.ts
// Duplicated here to avoid importing browser-specific code in this utility
const UPLOADS_DIR = "/uploads"

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
  const uploadPaths = new Set<string>()
  let result = content

  // Handle `image` frontmatter key with plain upload paths
  const { frontmatter } = parseFrontmatter(result)
  if (typeof frontmatter.image === "string" && frontmatter.image.startsWith(`${UPLOADS_DIR}/`)) {
    const imagePath = frontmatter.image
    const fileName = imagePath.split("/").pop()
    const newUrl = `https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/${fileName}`
    uploadPaths.add(imagePath)
    result = updateFrontmatterValue({
      content: result,
      properties: { image: newUrl },
    })
  }

  const mdast = fromMarkdown(result)
  const replacements: Array<{ start: number; end: number; text: string }> = []

  // Visit all link and image nodes
  visit(mdast, (node) => {
    if (node.type !== "link" && node.type !== "image") return
    if (!node.position || !node.url.startsWith(`${UPLOADS_DIR}/`)) return

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
  for (const { start, end, text } of replacements) {
    result = result.slice(0, start) + text + result.slice(end)
  }

  // Transform HTML img tags
  const escapedUploadsDir = UPLOADS_DIR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const imgRegex = new RegExp(
    `<img([^>]+)src=["'](?<url>${escapedUploadsDir}/[^"']+)["']([^>]*)>`,
    "g",
  )
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
