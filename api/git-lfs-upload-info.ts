// Reference: https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md

type LfsBatchRequest = {
  repo: string
  oid: string
  size: number
}

/** Gets upload URL and headers from GitHub's LFS batch API for direct browser upload. */
export async function POST(request: Request): Promise<Response> {
  try {
    const { repo, oid, size } = (await request.json()) as LfsBatchRequest
    const authorization = request.headers.get("authorization")

    if (
      typeof repo !== "string" ||
      typeof oid !== "string" ||
      typeof size !== "number" ||
      !authorization
    ) {
      throw new Error("Invalid request")
    }

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
      throw new Error("Unable to get upload info from Git LFS")
    }

    const json = await response.json()
    const object = json.objects[0]

    // If the object already exists (no upload action), return that info
    if (!object.actions?.upload) {
      return Response.json({ exists: true })
    }

    return Response.json({
      exists: false,
      upload: object.actions.upload,
      verify: object.actions.verify,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Error: ${message}`, { status: 500 })
  }
}
