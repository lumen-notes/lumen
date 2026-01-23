import emojiRegex from "emoji-regex"

/**
 * This function enhances social media sharing for shared notes.
 * It detects when a bot (like social media crawlers) accesses a shared note URL,
 * fetches the corresponding note content, and generates optimized HTML with
 * appropriate meta tags for better link previews on social media platforms.
 * For regular users, it serves the SPA shell so the app can handle the route.
 */
async function handle(request: Request): Promise<Response> {
  if (!isBot(request.headers.get("user-agent"))) {
    return await serveIndexHtml(request)
  }

  const url = getRequestUrl(request)
  const gistId = url.pathname.split("/share/")[1]

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`)

    if (!response.ok) {
      const html = `<!doctype html>
<html>
  <head>
    <title>Note not found</title>
  </head>
  <body>
    <h1>Note not found</h1>
  </body>
</html>`
      return new Response(html, { headers: { "Content-Type": "text/html" } })
    }

    const gist = await response.json()

    if (!gist.files) {
      throw new Error("No files found in gist")
    }

    const noteMarkdown = getNoteMarkdown(gist)
    const noteContent = removeFrontmatter(noteMarkdown)
    const noteTitle = getNoteTitle(noteContent)
    const frontmatter = parseFrontmatter(noteMarkdown)
    const ogImageUrl = getOgImageUrl(frontmatter)
    const fullTitle = noteTitle || gist.description || "Untitled"
    const leadingEmoji = getLeadingEmoji(fullTitle)
    const titleWithoutEmoji = leadingEmoji ? fullTitle.slice(leadingEmoji.length).trim() : fullTitle
    const pageTitle = getSanitizedText(titleWithoutEmoji || "Untitled")
    const pageDescription = "Shared note"
    const siteName = getSanitizedText(gist?.owner?.login || "Lumen")
    const escapedNoteContent = getSanitizedText(noteContent)
    const escapedUrl = getHtmlEscaped(url.href)
    const escapedImageUrl = ogImageUrl ? getHtmlEscaped(ogImageUrl) : ""
    const faviconHref = getFaviconHref(leadingEmoji || "📝")
    const html = `<!doctype html>
<html>
  <head>
    <title>${pageTitle}</title>
    <link rel="icon" href="${faviconHref}" />
    <meta charset="utf-8" />
    <meta name="description" content="${pageDescription}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${pageTitle}" />
    <meta property="og:description" content="${pageDescription}" />
    <meta property="og:url" content="${escapedUrl}" />
    <meta property="og:site_name" content="${siteName}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${pageTitle}" />
    <meta name="twitter:description" content="${pageDescription}" />
    ${ogImageUrl ? `<meta property="og:image" content="${escapedImageUrl}" />` : ""}
    ${ogImageUrl ? `<meta name="twitter:image" content="${escapedImageUrl}" />` : ""}
  </head>
  <body>
    <pre>${escapedNoteContent}</pre>
  </body>
</html>`

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (error) {
    console.error(error)
    return await serveIndexHtml(request)
  }
}

export const GET = handle
export async function HEAD(request: Request): Promise<Response> {
  const response = await handle(request)
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

async function serveIndexHtml(request: Request): Promise<Response> {
  try {
    const url = getRequestUrl(request)
    const origin = `${url.protocol}//${url.host}`
    const indexUrl = new URL("/index.html", origin)
    const response = await fetch(indexUrl, { headers: { Accept: "text/html" } })

    if (!response.ok) {
      return new Response("Not found", { status: response.status })
    }

    const headers = new Headers(response.headers)
    headers.set("Content-Type", "text/html")

    return new Response(response.body, {
      status: response.status,
      headers,
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Error: ${message}`, { status: 500 })
  }
}

// Comprehensive list of bot patterns copied from the isbot package
// https://github.com/omrilotan/isbot/blob/f483f15f663b59224f1e627377e70cc8270f693b/src/patterns.json
const botPatterns = [
  " daum[ /]",
  " deusu/",
  " yadirectfetcher",
  "(?:^|[^g])news(?!sapphire)",
  "(?<! (?:channel/|google/))google(?!(app|/google| pixel))",
  "(?<! cu)bots?(?:\\b|_)",
  "(?<!(?:lib))http",
  "(?<![hg]m)score",
  "@[a-z][\\w-]+\\.",
  "\\(\\)",
  "\\.com\\b",
  "\\btime/",
  "\\|",
  "^<",
  "^[\\w \\.\\-\\(?:\\):%]+(?:/v?\\d+(?:\\.\\d+)?(?:\\.\\d{1,10})*?)?(?:,|$)",
  "^[^ ]{50,}$",
  "^\\d+\\b",
  "^\\w*search\\b",
  "^\\w+/[\\w\\(\\)]*$",
  "^active",
  "^ad muncher",
  "^amaya",
  "^avsdevicesdk/",
  "^biglotron",
  "^bot",
  "^bw/",
  "^clamav[ /]",
  "^client/",
  "^cobweb/",
  "^custom",
  "^ddg[_-]android",
  "^discourse",
  "^dispatch/\\d",
  "^downcast/",
  "^duckduckgo",
  "^email",
  "^facebook",
  "^getright/",
  "^gozilla/",
  "^hobbit",
  "^hotzonu",
  "^hwcdn/",
  "^igetter/",
  "^jeode/",
  "^jetty/",
  "^jigsaw",
  "^microsoft bits",
  "^movabletype",
  "^mozilla/5\\.0\\s[a-z\\.-]+$",
  "^mozilla/\\d\\.\\d \\(compatible;?\\)$",
  "^mozilla/\\d\\.\\d \\w*$",
  "^navermailapp",
  "^netsurf",
  "^offline",
  "^openai/",
  "^owler",
  "^php",
  "^postman",
  "^python",
  "^rank",
  "^read",
  "^reed",
  "^rest",
  "^rss",
  "^snapchat",
  "^space bison",
  "^svn",
  "^swcd ",
  "^taringa",
  "^thumbor/",
  "^track",
  "^w3c",
  "^webbandit/",
  "^webcopier",
  "^wget",
  "^whatsapp",
  "^wordpress",
  "^xenu link sleuth",
  "^yahoo",
  "^yandex",
  "^zdm/\\d",
  "^zoom marketplace/",
  "^{{.*}}$",
  "adscanner/",
  "analyzer",
  "archive",
  "ask jeeves/teoma",
  "audit",
  "bit\\.ly/",
  "bluecoat drtr",
  "browsex",
  "burpcollaborator",
  "capture",
  "catch",
  "check\\b",
  "checker",
  "chrome-lighthouse",
  "chromeframe",
  "classifier",
  "cloudflare",
  "convertify",
  "cookiehubscan",
  "crawl",
  "cypress/",
  "dareboost",
  "datanyze",
  "dejaclick",
  "detect",
  "dmbrowser",
  "download",
  "evc-batch/",
  "exaleadcloudview",
  "feed",
  "firephp",
  "functionize",
  "gomezagent",
  "headless",
  "httrack",
  "hubspot marketing grader",
  "hydra",
  "ibisbrowser",
  "images",
  "infrawatch",
  "insight",
  "inspect",
  "iplabel",
  "ips-agent",
  "java(?!;)",
  "jsjcw_scanner",
  "library",
  "linkcheck",
  "mail\\.ru/",
  "manager",
  "measure",
  "neustar wpm",
  "node",
  "nutch",
  "offbyone",
  "optimize",
  "pageburst",
  "pagespeed",
  "parser",
  "perl",
  "phantomjs",
  "pingdom",
  "powermarks",
  "preview",
  "proxy",
  "ptst[ /]\\d",
  "reputation",
  "resolver",
  "retriever",
  "rexx;",
  "rigor",
  "rss\\b",
  "scanner\\.",
  "scrape",
  "server",
  "sogou",
  "sparkler/",
  "speedcurve",
  "spider",
  "splash",
  "statuscake",
  "supercleaner",
  "synapse",
  "synthetic",
  "tools",
  "torrent",
  "trace",
  "transcoder",
  "url",
  "validator",
  "virtuoso",
  "wappalyzer",
  "webglance",
  "webkit2png",
  "whatcms/",
  "zgrab",
]

/**
 * Detects if a user agent string belongs to a bot by checking
 * for common bot patterns and identifiers. Implementation based on
 * the isbot package (https://github.com/omrilotan/isbot)
 */
function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false
  const pattern = new RegExp(botPatterns.join("|"), "i")
  return pattern.test(userAgent)
}

type File = {
  filename?: string
  type?: string
  content?: string
}

function getNoteMarkdown(gist: { files: Record<string, File> }): string {
  const readmeFile = Object.values(gist.files as Record<string, File>).find(
    (file) => file?.filename?.toLowerCase() === "readme.md",
  )
  const markdownFile =
    readmeFile ||
    Object.values(gist.files as Record<string, File>).find((file) => file?.type === "text/markdown")

  return markdownFile?.content || ""
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
  const titleRegex = /^# (.*)$/m
  const match = content.trim().match(titleRegex)

  return match?.[1] || ""
}

/**
 * Extracts frontmatter properties from markdown content.
 * Returns an object with the extracted properties.
 */
function parseFrontmatter(markdown: string): Record<string, string> {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/
  const match = markdown.match(frontmatterRegex)

  if (!match) {
    return {}
  }

  const frontmatterYaml = match[1]
  const result: Record<string, string> = {}

  const lines = frontmatterYaml.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue


    const keyValueMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/)
    if (keyValueMatch) {
      const key = keyValueMatch[1]
      let value = keyValueMatch[2].trim()

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      result[key] = value
    }
  }

  return result
}

/**
 * Extracts URL from markdown image syntax
 */
function extractImageUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const markdownImageMatch = trimmed.match(/^!\[.*?\]\((.*?)\)$/)
  if (markdownImageMatch) {
    return markdownImageMatch[1].trim()
  }

  if (/^https?:\/\//.test(trimmed)) {
    return trimmed
  }

  return null
}

/**
 * Gets the og:image URL from frontmatter.
 * Returns the URL from the 'image' property if present.
 */
function getOgImageUrl(frontmatter: Record<string, string>): string | null {
  if (frontmatter.image && typeof frontmatter.image === "string") {
    const imageUrl = extractImageUrl(frontmatter.image)
    if (imageUrl) {
      return imageUrl
    }
  }

  return null
}

function getRequestUrl(request: Request): URL {
  try {
    return new URL(request.url)
  } catch {
    const host = request.headers.get("host") ?? "localhost"
    const proto = request.headers.get("x-forwarded-proto") ?? "http"
    return new URL(request.url, `${proto}://${host}`)
  }
}

/**
 * Removes dangerous HTML characters to prevent XSS attacks.
 * Removes <, >, &, ", and ' characters for cleaner previews.
 * Since previews only display text, removing these characters
 * is safer and produces cleaner output than HTML entities.
 */
function getSanitizedText(text: string): string {
  return text.replace(/[<>&"']/g, "")
}

/**
 * Escapes HTML entities to prevent XSS attacks.
 * Used for URLs which must preserve all characters.
 */
function getHtmlEscaped(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Extracts the leading emoji from a string.
 * Returns the first emoji if it appears at the start of the string, otherwise null.
 */
function getLeadingEmoji(str: string): string | null {
  const regex = emojiRegex()
  const matches = [...str.matchAll(regex)]

  if (matches.length > 0 && matches[0].index === 0) {
    return matches[0][0]
  }

  return null
}

/**
 * Creates a data URI for an SVG favicon containing the emoji.
 */
function getFaviconHref(emoji: string): string {
  const encodedEmoji = encodeURIComponent(emoji)
  return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${encodedEmoji}</text></svg>`
}