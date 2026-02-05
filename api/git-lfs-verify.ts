// Reference: https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md

type LfsVerifyRequest = {
  oid: string
  size: number
  verifyUrl?: string
  verifyHeader?: Record<string, string>
}

/** Verifies that an upload to GitHub's LFS storage completed successfully. */
export async function POST(request: Request): Promise<Response> {
  try {
    const { oid, size, verifyUrl, verifyHeader } = (await request.json()) as LfsVerifyRequest

    if (typeof oid !== "string" || typeof size !== "number") {
      throw new Error("Invalid request")
    }

    // If no verify URL provided, the object might already exist or verification not needed
    if (!verifyUrl) {
      return new Response("OK", { status: 200 })
    }

    const verifyResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: verifyHeader,
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
