/// <reference lib="deno.ns" />

import type { Config } from "https://edge.netlify.com"

// Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
export default async (request: Request) => {
  try {
    const code = new URL(request.url).searchParams.get("code")
    const state = new URL(request.url).searchParams.get("state")

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

    const { error, access_token } = await response.json()

    if (error) {
      throw new Error(error)
    }

    const username = await getUsername(access_token)

    const redirectUrl = new URL(state || "https://uselumen.com")
    redirectUrl.searchParams.set("access_token", access_token)
    redirectUrl.searchParams.set("username", username)

    return Response.redirect(`${redirectUrl}`)
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}

async function getUsername(token: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const { error, login: username } = await response.json()

  if (error) {
    throw new Error(error)
  }

  return username
}

export const config: Config = {
  path: "/github-auth",
}
