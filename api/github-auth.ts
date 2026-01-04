// Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

export async function GET(request: Request): Promise<Response> {
  try {
    const url = getRequestUrl(request)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.VITE_GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const { error, access_token: token } = await response.json()

    if (error) {
      throw new Error(error)
    }

    const { id, login, name, email } = await getUser(token)

    const redirectUrl = new URL(state || "https://uselumen.com")
    redirectUrl.searchParams.set("user_token", token)
    if (typeof id === "number" && Number.isFinite(id)) {
      redirectUrl.searchParams.set("user_id", String(id))
    }
    redirectUrl.searchParams.set("user_login", login)
    redirectUrl.searchParams.set("user_name", name)
    redirectUrl.searchParams.set("user_email", email)

    return Response.redirect(redirectUrl.toString())
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Error: ${message}`, { status: 500 })
  }
}

async function getUser(token: string) {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const { error, id, login, name } = await userResponse.json()

  if (error) {
    throw new Error(error)
  }

  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (emailResponse.status === 401) {
    throw new Error("Invalid token")
  }

  if (!emailResponse.ok) {
    throw new Error("Error getting user's emails")
  }

  const emails = (await emailResponse.json()) as Array<{
    email: string
    primary: boolean
    visibility: string
  }>
  const primaryEmail = emails.find((email) => email.visibility !== "private")

  if (!primaryEmail) {
    throw new Error(
      "No public email found. Check your email settings in https://github.com/settings/emails",
    )
  }

  return { id, login, name, email: primaryEmail.email }
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
