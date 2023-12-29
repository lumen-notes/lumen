/// <reference lib="deno.ns" />

import type { Config } from "https://edge.netlify.com"
import { decodeBase64 } from "https://deno.land/std/encoding/base64.ts"

// Reference: https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md

export default async (request: Request) => {
  switch (request.method) {
    case "GET":
      return await get(request)
    case "POST":
      return await post(request)
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
        Accept: "application/vnd.git-lfs+json",
        "Content-Type": "application/vnd.git-lfs+json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        operation: "download",
        transfers: ["basic"],
        objects: [{ oid, size }],
      }),
    })

    if (!response.ok) {
      throw new Error("Unable to resolve Git LFS pointer")
    }

    const json = await response.json()
    const href = json.objects[0].actions.download.href

    return new Response(href, { status: 200 })
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}

/** Upload file to GitHub's Git LFS server */
async function post(request: Request) {
  try {
    const { repo, content, oid, size } = await request.json()
    const authorization = request.headers.get("Authorization")

    if (
      typeof repo !== "string" ||
      typeof content !== "string" ||
      typeof oid !== "string" ||
      typeof size !== "number" ||
      !authorization
    ) {
      throw new Error("Invalid request")
    }

    const binaryContent = decodeBase64(content)

    // Request upload URL and headers
    const response = await fetch(`https://github.com/${repo}.git/info/lfs/objects/batch`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.git-lfs+json",
        "Content-Type": "application/vnd.git-lfs+json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        operation: "upload",
        transfers: ["basic"],
        objects: [{ oid, size }],
      }),
    })

    if (!response.ok) {
      throw new Error("Unable to resolve Git LFS pointer")
    }

    const json = await response.json()
    const { upload, verify } = json.objects[0].actions

    // Upload file to Git LFS server
    const uploadResponse = await fetch(upload.href, {
      method: "PUT",
      headers: {
        ...upload.header,
        "Content-Type": "application/octet-stream",
      },
      body: binaryContent,
    })

    if (!uploadResponse.ok) {
      throw new Error("Unable to upload file")
    }

    // Verify upload
    const verifyResponse = await fetch(verify.href, {
      method: "POST",
      headers: verify.header,
      body: JSON.stringify({ oid, size }),
    })

    if (!verifyResponse.ok) {
      throw new Error("Unable to verify upload")
    }

    return new Response("OK", { status: 200 })
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}

export const config: Config = {
  path: "/git-lfs-file",
}
