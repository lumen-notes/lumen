// Reference: https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md

type LfsUploadRequest = {
  repo: string
  content: string
  oid: string
  size: number
}

/** Resolves a Git LFS pointer to get the actual file download URL. */
export async function GET(request: Request): Promise<Response> {
  try {
    const url = getRequestUrl(request)
    const repo = url.searchParams.get("repo")
    const pointer = url.searchParams.get("pointer")
    const authorization = request.headers.get("authorization")

    if (!repo || !pointer || !authorization) {
      throw new Error("Invalid request")
    }

    const oid = pointer.match(/oid sha256:(?<oid>[a-f0-9]{64})/)?.groups?.oid
    const size = parseInt(pointer.match(/size (?<size>\d+)/)?.groups?.size ?? "0")

    if (!oid || !Number.isFinite(size)) {
      throw new Error("Invalid pointer")
    }

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
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Error: ${message}`, { status: 500 })
  }
}

/** Uploads a file to Git LFS storage. */
export async function POST(request: Request): Promise<Response> {
  try {
    const { repo, content, oid, size } = (await request.json()) as LfsUploadRequest
    const authorization = request.headers.get("authorization")

    if (
      typeof repo !== "string" ||
      typeof content !== "string" ||
      typeof oid !== "string" ||
      typeof size !== "number" ||
      !authorization
    ) {
      throw new Error("Invalid request")
    }

    const binaryContent = Buffer.from(content, "base64")

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
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Error: ${message}`, { status: 500 })
  }
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
