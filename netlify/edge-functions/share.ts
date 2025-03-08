/// <reference lib="deno.ns" />

import type { Config, Context } from "https://edge.netlify.com"

/**
 * This edge function enhances social media sharing for shared notes.
 * It detects when a bot (like social media crawlers) accesses a shared note URL,
 * fetches the corresponding note content, and generates optimized HTML with
 * appropriate meta tags for better link previews on social media platforms.
 * For regular users, it passes the request through to the normal application flow.
 */
export default async (request: Request, context: Context) => {
  // Pass through for regular users
  if (!isBot(request.headers.get("user-agent"))) {
    return await context.next()
  }

  const url = new URL(request.url)
  const gistId = url.pathname.split("/share/")[1]

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`)

    if (!response.ok) {
      throw new Error("Not found")
    }

    const gist = await response.json()

    if (!gist.files) {
      throw new Error("No files found in gist")
    }

    const noteContent = getNoteContent(gist)
    const noteTitle = getNoteTitle(noteContent)
    const pageTitle = noteTitle || gist.description || "Shared note"
    const pageImageUrl = gist.owner?.avatar_url

    const html = `<!doctype html>
<html>
  <head>
    <title>${pageTitle}</title>
    <meta charset="utf-8" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${pageTitle}" />
    <meta property="og:url" content="${url.href}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${pageTitle}" />
    ${pageImageUrl ? `<meta property="og:image" content="${pageImageUrl}" /><meta name="twitter:image" content="${pageImageUrl}" />` : ""}
  </head>
  <body>
    <pre>${noteContent}</pre>
  </body>
</html>`

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (_error) {
    return await context.next()
  }
}

/**
 * Detects if a user agent string belongs to a bot by checking
 * for common social media crawlers and bot identifiers
 */
function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false

  const botPatterns = [
    "bot",
    "spider",
    "crawler",
    "facebookexternalhit",
    "twitterbot",
    "whatsapp",
    "telegram",
    "discord",
    "slackbot",
    "linkedinbot",
    "googlebot",
  ]

  const lowerUserAgent = userAgent.toLowerCase()
  return botPatterns.some((pattern) => lowerUserAgent.includes(pattern))
}

type File = {
  filename?: string
  type?: string
  content?: string
}

function getNoteContent(gist: { files: Record<string, File> }) {
  // We need to locate a markdown file within the gist to use as the note content
  // If there's a README.md file, we use that. Otherwise, we use the first markdown file we find
  const readmeFile = Object.values(gist.files as Record<string, File>).find(
    (file) => file?.filename?.toLowerCase() === "readme.md",
  )
  const markdownFile =
    readmeFile ||
    Object.values(gist.files as Record<string, File>).find((file) => file?.type === "text/markdown")

  const content = removeFrontmatter(markdownFile?.content || "")

  return content
}

function removeFrontmatter(markdown: string) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = markdown.match(frontmatterRegex)

  if (match) {
    return match[2]
  }

  return markdown
}

function getNoteTitle(content: string) {
  // Look for the first heading level 1 (# title) anywhere in the content
  const titleRegex = /^# (.*)$/m
  const match = content.trim().match(titleRegex)

  return match?.[1] || ""
}

export const config: Config = { path: "/share/*" }
