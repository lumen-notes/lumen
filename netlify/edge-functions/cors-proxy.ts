/// <reference lib="deno.ns" />

import type { Config } from "https://edge.netlify.com"

// Reference: https://github.com/isomorphic-git/cors-proxy

const ALLOW_HEADERS = [
  "accept-encoding",
  "accept-language",
  "accept",
  "access-control-allow-origin",
  "authorization",
  "cache-control",
  "connection",
  "content-length",
  "content-type",
  "dnt",
  "git-protocol",
  "pragma",
  "range",
  "referer",
  "user-agent",
  "x-authorization",
  "x-http-method-override",
  "x-requested-with",
]

const EXPOSE_HEADERS = [
  "accept-ranges",
  "age",
  "cache-control",
  "content-length",
  "content-language",
  "content-type",
  "date",
  "etag",
  "expires",
  "last-modified",
  "location",
  "pragma",
  "server",
  "transfer-encoding",
  "vary",
  "x-github-request-id",
  "x-redirected-url",
]

export default async (request: Request) => {
  // The request URL will look like: "https://.../cors-proxy/example.com/..."
  // We want to strip off the "https://.../cors-proxy/" part of the URL
  // and proxy the request to the remaining URL.
  const url = request.url.replace(/^.*\/cors-proxy\//, "https://")

  // Filter request headers
  const requestHeaders = new Headers()
  for (const [key, value] of request.headers.entries()) {
    if (ALLOW_HEADERS.includes(key.toLowerCase())) {
      requestHeaders.set(key, value)
    }
  }

  // GitHub requests behave differently if the user-agent starts with "git/"
  requestHeaders.set("user-agent", "git/lumen/cors-proxy")

  const response = await fetch(url, {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
  })

  // Filter response headers
  const responseHeaders = new Headers()
  for (const [key, value] of response.headers.entries()) {
    if (EXPOSE_HEADERS.includes(key.toLowerCase())) {
      responseHeaders.set(key, value)
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export const config: Config = {
  path: "/cors-proxy/*",
}
