import { Image, Link, Text } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { visit } from "unist-util-visit"

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
