/// <reference lib="deno.ns" />

import type { Config } from "https://edge.netlify.com"

export default async (request: Request) => {
  switch (request.method) {
    case "GET":
      return await get(request)
    default:
      return new Response("Method not allowed", { status: 405 })
  }
}

/** Resolve a Git LFS pointer to a file URL */
async function get(request: Request) {
  try {
    const url = new URL(request.url)
    const repo = url.searchParams.get("repo")
    const pointer = url.searchParams.get("pointer")
    const authorization = request.headers.get("Authorization")

    if (!repo || !pointer || !authorization) {
      throw new Error("Invalid request")
    }

    const oid = pointer.match(/oid sha256:(?<oid>[a-f0-9]{64})/)?.groups?.oid
    const size = parseInt(pointer.match(/size (?<size>\d+)/)?.groups?.size ?? "0")

    const response = await fetch(`https://github.com/${repo}.git/info/lfs/objects/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.git-lfs+json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        operation: "download",
        transfers: ["basic"],
        objects: [{ oid, size }],
      }),
    })

    const json = await response.json()
    const href = json.objects[0].actions.download.href

    return new Response(href, { status: 200 })
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}

export const config: Config = {
  path: "/git-lfs-file",
}
