// Reference: https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md

type LfsVerifyRequest = {
  repo: string
  oid: string
  size: number
}

/** Verifies that an upload to GitHub's LFS storage completed successfully. */
export async function POST(request: Request): Promise<Response> {
  try {
    const { repo, oid, size } = (await request.json()) as LfsVerifyRequest
    const authorization = request.headers.get("authorization")

    if (
      typeof repo !== "string" ||
      typeof oid !== "string" ||
      typeof size !== "number" ||
      !authorization
    ) {
      throw new Error("Invalid request")
    }

    // Get the verify URL from batch API
    const batchResponse = await fetch(`https://github.com/${repo}.git/info/lfs/objects/batch`, {
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

    if (!batchResponse.ok) {
      throw new Error("Unable to get verify info from Git LFS")
    }

    const json = await batchResponse.json()
    const verify = json.objects[0].actions?.verify

    if (!verify) {
      // No verify action needed (object might already exist)
      return new Response("OK", { status: 200 })
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
