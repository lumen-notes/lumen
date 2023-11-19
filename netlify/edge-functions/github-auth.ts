/// <reference lib="deno.ns" />

import type { Config } from "https://edge.netlify.com"

// Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
export default async (request: Request) => {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: Deno.env.get("VITE_GITHUB_CLIENT_ID"),
        client_secret: Deno.env.get("GITHUB_CLIENT_SECRET"),
        code,
      }),
    })

    const { error, access_token: token } = await response.json()

    if (error) {
      throw new Error(error)
    }

    const { login, name, email } = await getUser(token)

    const redirectUrl = new URL(state || "https://uselumen.com")
    redirectUrl.searchParams.set("user_token", token)
    redirectUrl.searchParams.set("user_login", login)
    redirectUrl.searchParams.set("user_name", name)
    redirectUrl.searchParams.set("user_email", email)

    return Response.redirect(`${redirectUrl}`)
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}

async function getUser(token: string) {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const { error, login, name } = await userResponse.json()

  if (error) {
    throw new Error(error)
  }

  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const emails = (await emailResponse.json()) as Array<{ email: string; primary: boolean }>
  const primaryEmail = emails.find((email) => email.primary)

  if (!primaryEmail) {
    throw new Error("No primary email found")
  }

  return { login, name, email: primaryEmail.email }
}

export const config: Config = {
  path: "/github-auth",
}
