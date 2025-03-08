/// <reference lib="deno.ns" />

import type { Config } from "https://edge.netlify.com"

/**
 * This edge function proxies a file from a given URL and returns it directly.
 * The URL should be provided as a query parameter, e.g. /file-proxy?url=https://example.com/image.jpg
 */
export default async (request: Request) => {
  try {
    const url = new URL(request.url)
    const fileUrl = url.searchParams.get("url")

    if (!fileUrl) {
      return new Response("Missing 'url' query parameter", { status: 400 })
    }

    // Fetch the file
    const response = await fetch(fileUrl)

    if (!response.ok) {
      return new Response(`Failed to fetch file: ${response.statusText}`, {
        status: response.status,
      })
    }

    // Get the content type from the original response
    const contentType = response.headers.get("content-type") || "application/octet-stream"

    // Return the file directly with appropriate headers
    return new Response(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error(error)
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}

export const config: Config = {
  path: "/file-proxy",
}
